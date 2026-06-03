"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdminModule, WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { adminApi } from "@/infrastructure/http/adminApi";

const api = adminApi;

export interface AdminDataState {
  modules:   AdminModule[];
  catalog:   WidgetCatalogEntry[];
  loading:   boolean;
  loadError: string | null;
  reload:    () => void;
}

export function useAdminData(): AdminDataState {
  const [modules,   setModules]   = useState<AdminModule[]>([]);
  const [catalog,   setCatalog]   = useState<WidgetCatalogEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rev,       setRev]       = useState(0);

  const reload = useCallback(() => setRev((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const formsModules = await api.listFormsModules();

        // Load screens (new API) for all modules in parallel
        const screensByModule = await Promise.all(
          formsModules.map((m) => api.listFormScreens(m.code).catch(() => [])),
        );

        const adminModules: AdminModule[] = [];
        formsModules.forEach((m, idx) => {
          screensByModule[idx].forEach((screen, order) => {
            adminModules.push({
              id:                     screen.id,
              groupSlug:              m.code,
              groupLabel:             m.name,
              slug:                   `${m.code}/${screen.code}`,
              label:                  screen.title,
              icon:                   "",
              description:            m.description ?? "",
              sortOrder:              screen.sortOrder ?? order,
              requiredRoles:          null,
              isActive:               screen.status === "Published",
              isVisible:              true,
              refreshIntervalSeconds: null,
            });
          });
        });

        if (cancelled) return;
        setModules(adminModules);

        const widgetCatalog = await api.listWidgetCatalog().catch(() => [] as WidgetCatalogEntry[]);
        if (cancelled) return;
        setCatalog(widgetCatalog);
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message ?? "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [rev]);

  return { modules, catalog, loading, loadError, reload };
}
