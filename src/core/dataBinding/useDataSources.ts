"use client";

import { useEffect, useState } from "react";
import type { DataSource } from "@/infrastructure/http/adminApi";
import useAuthStore from "@/core/auth/authStore";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "https://192.168.100.60:8443").replace(/\/+$/, "");

export function useDataSources(
  dataSources: DataSource[],
  routeParams: Record<string, string>,
): {
  sourceData: Record<string, unknown>;
  sourcesLoading: boolean;
} {
  const [sourceData, setSourceData] = useState<Record<string, unknown>>({});
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const dataSourcesKey = JSON.stringify(dataSources);
  const routeParamsKey = JSON.stringify(routeParams);

  useEffect(() => {
    const ds: DataSource[] = JSON.parse(dataSourcesKey) as DataSource[];
    const params: Record<string, string> = JSON.parse(routeParamsKey) as Record<string, string>;

    if (!ds.length) return;

    // Only gate fetching on params that are actually used as {param} placeholders
    // in the resourcePath. Declared requiredParams that don't appear in the path
    // are ignored — they don't need a URL value to build the request.
    const active = ds.filter((s) => {
      const pathPlaceholders = new Set(
        (s.resourcePath ?? "").match(/\{(\w+)\}/g)?.map((m) => m.slice(1, -1)) ?? [],
      );
      const effectiveRequired = s.requiredParams.filter((p) => pathPlaceholders.has(p));
      return effectiveRequired.every((p) => Boolean(params[p]));
    });
    if (!active.length) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSourcesLoading(true);

    Promise.all(
      active.map(async (source) => {
        const rawPath = source.resourcePath ?? "";
        if (!rawPath) return [source.namespace, null] as const;

        // 1. Substitute {name} placeholders in path
        const path = rawPath.replace(
          /\{(\w+)\}/g,
          (_, key) => encodeURIComponent(params[key] ?? ""),
        );

        // 2. Only add requiredParams that are NOT path-placeholders → query string (doc 60 §3).
        // Do NOT blindly forward all routeParams — routing params like `module` and `screen`
        // must not leak into backend data calls.
        const pathPlaceholders = new Set(
          (rawPath.match(/\{(\w+)\}/g) ?? []).map((m) => m.slice(1, -1)),
        );
        const qs = new URLSearchParams();
        for (const name of source.requiredParams) {
          if (!pathPlaceholders.has(name)) {
            const v = params[name];
            if (v !== undefined && v !== "") qs.append(name, v);
          }
        }
        // 3. kind=Single → append ?mode=single (doc 58/60)
        if (source.kind === "Single") qs.append("mode", "single");

        // doc 41: layout response carries baseUrl resolved from Provider Catalog.
        // resourcePath may already contain '?' (baked-in query params) — use '&' to extend.
        const baseUrl = source.baseUrl?.replace(/\/+$/, "") ?? "";
        const base = baseUrl || (path.startsWith("http") ? "" : BASE);
        const hasQuery = path.includes("?");
        const sep = hasQuery ? "&" : "?";
        const fullUrl = `${base}${path}${qs.toString() ? `${sep}${qs}` : ""}`;

        try {
          const res = await fetch(fullUrl, {
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {},
          });
          if (!res.ok) return [source.namespace, null] as const;
          const raw = await res.json() as Record<string, unknown>;

          // Unwrap DynamicFormService / DataMatchingService envelope: { success, data: {...|[...]} }
          const responseData = raw?.data ?? raw;

          // kind=Single: prefer `single` object if BE returned it (doc 58/60 §4)
          // `single` is a flat dict — expressions resolve directly without array unwrapping.
          if (source.kind === "Single") {
            const prefillSingle = (responseData as Record<string, unknown>)?.single;
            if (prefillSingle != null && typeof prefillSingle === "object" && !Array.isArray(prefillSingle)) {
              return [source.namespace, prefillSingle] as const;
            }
          }

          // DataMatchingService stores canonicalPayload as a JSON *string* in each record.
          // Parse and spread it so expressions like {{sources.ns.HoTen}} (single) or
          // {{sources.ns[0].HoTen}} (list) resolve directly without extra nesting.
          let data: unknown;
          if (Array.isArray(responseData)) {
            // List response (e.g. GET /dm/records): parse canonicalPayload in each row
            data = (responseData as Record<string, unknown>[]).map((item) => {
              const rawCp = item?.canonicalPayload;
              if (rawCp == null) return item;
              try {
                const parsed: Record<string, unknown> =
                  typeof rawCp === "string"
                    ? (JSON.parse(rawCp) as Record<string, unknown>)
                    : (rawCp as Record<string, unknown>);
                return { ...item, ...parsed };
              } catch {
                return item;
              }
            });
          } else {
            // Single-object response: parse canonicalPayload at top level
            const obj = responseData as Record<string, unknown>;
            const rawCp = obj?.canonicalPayload;
            if (rawCp != null) {
              try {
                const parsed: Record<string, unknown> =
                  typeof rawCp === "string"
                    ? (JSON.parse(rawCp) as Record<string, unknown>)
                    : (rawCp as Record<string, unknown>);
                data = { ...obj, ...parsed };
              } catch {
                data = obj;
              }
            } else {
              data = obj;
            }
          }

          return [source.namespace, data] as const;
        } catch {
          return [source.namespace, null] as const;
        }
      }),
    )
      .then((results) => {
        if (cancelled) return;
        const map: Record<string, unknown> = {};
        for (const [ns, data] of results) {
          if (data != null) map[ns] = data;
        }
        setSourceData(map);
      })
      .finally(() => {
        if (!cancelled) setSourcesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dataSourcesKey, routeParamsKey, accessToken]);

  return { sourceData, sourcesLoading };
}
