"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdminModule, WidgetSchemaEntry, ProviderInfo, OperationEntry } from "@/infrastructure/http/adminApi";
import { adminApi } from "@/infrastructure/http/adminApi";

const api = adminApi;

export interface AdminDataState {
  modules:    AdminModule[];
  catalog:    WidgetSchemaEntry[];
  providers:  ProviderInfo[];
  operations: OperationEntry[];
  loading:    boolean;
  loadError:  string | null;
  reload:     () => void;
}

export function useAdminData(): AdminDataState {
  const [modules,    setModules]    = useState<AdminModule[]>([]);
  const [catalog,    setCatalog]    = useState<WidgetSchemaEntry[]>([]);
  const [providers,  setProviders]  = useState<ProviderInfo[]>([]);
  const [operations, setOperations] = useState<OperationEntry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState<string | null>(null);
  const [rev,        setRev]        = useState(0);

  const reload = useCallback(() => setRev((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        // Modules = nhóm (FormsModule), Pages = page trong mỗi nhóm
        const formsModules = await api.listFormsModules();

        // Load pages song song cho tất cả modules
        const pagesByModule = await Promise.all(
          formsModules.map((m) => api.listPages(m.code).catch(() => [])),
        );

        // Map sang AdminModule[] để sidebar/designer dùng tiếp
        const adminModules: AdminModule[] = [];
        formsModules.forEach((m, idx) => {
          pagesByModule[idx].forEach((page, order) => {
            adminModules.push({
              id:                     page.id,
              groupSlug:              m.code,
              groupLabel:             m.name,
              slug:                   `${m.code}/${page.code}`,
              label:                  page.title,
              icon:                   "",
              description:            m.description ?? "",
              sortOrder:              order,
              requiredRoles:          null,
              isActive:               page.status === "published",
              isVisible:              true,
              refreshIntervalSeconds: null,
            });
          });
        });

        if (cancelled) return;
        setModules(adminModules);

        const [schemas, provs, ops] = await Promise.all([
          api.listSchemas().catch(() => [] as WidgetSchemaEntry[]),
          api.listProviders().catch(() => [] as ProviderInfo[]),
          api.listOperations().catch(() => [] as OperationEntry[]),
        ]);
        if (cancelled) return;
        setCatalog(schemas);
        setProviders(provs);
        setOperations(ops);
      } catch (err) {
        if (!cancelled) setLoadError((err as Error).message ?? "Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [rev]);

  return { modules, catalog, providers, operations, loading, loadError, reload };
}
