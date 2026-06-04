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

    // Only fetch sources whose required params are all available
    const active = ds.filter((s) =>
      s.requiredParams.every((p) => Boolean(params[p])),
    );
    if (!active.length) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSourcesLoading(true);

    Promise.all(
      active.map(async (source) => {
        const path = source.resourcePath.replace(
          /\{(\w+)\}/g,
          (_, key) => encodeURIComponent(params[key] ?? ""),
        );
        const url = path.startsWith("http") ? path : `${BASE}${path}`;
        try {
          const res = await fetch(url, {
            headers: accessToken
              ? { Authorization: `Bearer ${accessToken}` }
              : {},
          });
          if (!res.ok) return [source.namespace, null] as const;
          const raw = await res.json() as Record<string, unknown>;

          // Unwrap DynamicFormService / DataMatchingService envelope: { success, data: {...} }
          const responseData = (raw?.data as Record<string, unknown>) ?? raw;

          // DataMatchingService stores canonicalPayload as a JSON *string* inside data
          // Parse it and spread at the namespace root so expressions like
          // {{sources.record.HoTen}} resolve directly without extra nesting
          const canonicalRaw = responseData?.canonicalPayload;
          let data: unknown;
          if (canonicalRaw != null) {
            try {
              const parsed: Record<string, unknown> =
                typeof canonicalRaw === "string"
                  ? (JSON.parse(canonicalRaw) as Record<string, unknown>)
                  : (canonicalRaw as Record<string, unknown>);
              // Merge: original response fields + all canonical fields at top level
              data = { ...responseData, ...parsed };
            } catch {
              data = responseData;
            }
          } else {
            data = responseData;
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
