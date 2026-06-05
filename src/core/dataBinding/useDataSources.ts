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
        const path = rawPath.replace(
          /\{(\w+)\}/g,
          (_, key) => encodeURIComponent(params[key] ?? ""),
        );
        // doc 41: layout response carries baseUrl resolved from Provider Catalog
        const baseUrl = source.baseUrl?.replace(/\/+$/, "") ?? "";
        const url = baseUrl
          ? `${baseUrl}${path}`
          : path.startsWith("http") ? path : `${BASE}${path}`;
        try {
          const res = await fetch(url, {
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {},
          });
          if (!res.ok) return [source.namespace, null] as const;
          const raw = await res.json() as Record<string, unknown>;

          // Unwrap DynamicFormService / DataMatchingService envelope: { success, data: {...|[...]} }
          const responseData = raw?.data ?? raw;

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
