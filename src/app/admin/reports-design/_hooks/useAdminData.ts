"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminModule, WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { adminApi } from "@/infrastructure/http/adminApi";

const api = adminApi;

export const ADMIN_DATA_KEY = ["admin", "designer-data"] as const;

export interface AdminDataState {
  modules:   AdminModule[];
  catalog:   WidgetCatalogEntry[];
  loading:   boolean;
  loadError: string | null;
  reload:    () => void;
}

async function fetchAdminData(): Promise<{ modules: AdminModule[]; catalog: WidgetCatalogEntry[] }> {
  const formsModules = await api.listFormsModules();

  const screensByModule = await Promise.all(
    formsModules.map((m) => api.listFormScreens(m.code).catch(() => [])),
  );

  const modules: AdminModule[] = [];
  formsModules.forEach((m, idx) => {
    screensByModule[idx].forEach((screen, order) => {
      modules.push({
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

  const catalog = await api.listWidgetCatalog().catch(() => [] as WidgetCatalogEntry[]);
  return { modules, catalog };
}

export function useAdminData(): AdminDataState {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ADMIN_DATA_KEY,
    queryFn:  fetchAdminData,
    staleTime: 60_000,
  });

  const reload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ADMIN_DATA_KEY });
  }, [queryClient]);

  return {
    modules:   data?.modules   ?? [],
    catalog:   data?.catalog   ?? [],
    loading:   isLoading,
    loadError: error ? (error as Error).message ?? "Không thể tải dữ liệu" : null,
    reload,
  };
}
