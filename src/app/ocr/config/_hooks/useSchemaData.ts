"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DocumentType, OcrSchema, OcrSchemaListItem, OcrSchemaStats } from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";

export const SCHEMA_LIST_KEY  = ["ocr", "schemas"]      as const;
export const SCHEMA_STATS_KEY = ["ocr", "schema-stats"] as const;

export interface UseSchemaDataReturn {
  schemas:      OcrSchemaListItem[];
  stats:        OcrSchemaStats | null;
  loading:      boolean;
  statsLoading: boolean;
  loadError:    string | null;

  search:       string;
  filterType:   DocumentType | undefined;
  filterActive: boolean | undefined;

  setSearch:       (v: string) => void;
  setFilterType:   (v: DocumentType | undefined) => void;
  setFilterActive: (v: boolean | undefined) => void;

  loadSchemas:    () => void;
  loadStats:      () => void;
  refresh:        () => void;
  patchListItem:  (updated: OcrSchema) => void;
  removeListItem: (id: string) => void;
}

export function useSchemaData(): UseSchemaDataReturn {
  const queryClient = useQueryClient();

  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState<DocumentType | undefined>();
  const [filterActive, setFilterActive] = useState<boolean | undefined>();

  const filters = {
    search:   search.trim() || undefined,
    type:     filterType,
    isActive: filterActive,
  };

  const schemasQuery = useQuery({
    queryKey: [...SCHEMA_LIST_KEY, filters],
    queryFn: () => {
      const params: { search?: string; type?: DocumentType; isActive?: boolean } = {};
      if (search.trim())              params.search   = search.trim();
      if (filterType)                 params.type     = filterType;
      if (filterActive !== undefined) params.isActive = filterActive;
      return ocrApi.listSchemas(params);
    },
    staleTime: 30_000,
  });

  const statsQuery = useQuery({
    queryKey: SCHEMA_STATS_KEY,
    queryFn:  () => ocrApi.getStats(),
    staleTime: 60_000,
  });

  const loadSchemas = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SCHEMA_LIST_KEY });
  }, [queryClient]);

  const loadStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SCHEMA_STATS_KEY });
  }, [queryClient]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: SCHEMA_LIST_KEY });
    queryClient.invalidateQueries({ queryKey: SCHEMA_STATS_KEY });
  }, [queryClient]);

  // Optimistic patch — cập nhật cache sau khi mutation ở page gọi vào
  const patchListItem = useCallback((updated: OcrSchema) => {
    queryClient.setQueriesData<OcrSchemaListItem[]>(
      { queryKey: SCHEMA_LIST_KEY },
      (prev) =>
        prev?.map((s) =>
          s.id === updated.id
            ? {
                ...s,
                name:        updated.name,
                description: updated.description,
                isActive:    updated.isActive,
                _count: {
                  fields:    updated.fields.length,
                  tables:    updated.tables.length,
                  documents: s._count.documents,
                },
              }
            : s,
        ) ?? [],
    );
  }, [queryClient]);

  const removeListItem = useCallback((id: string) => {
    queryClient.setQueriesData<OcrSchemaListItem[]>(
      { queryKey: SCHEMA_LIST_KEY },
      (prev) => prev?.filter((s) => s.id !== id) ?? [],
    );
  }, [queryClient]);

  return {
    schemas:      schemasQuery.data ?? [],
    stats:        statsQuery.data   ?? null,
    loading:      schemasQuery.isLoading,
    statsLoading: statsQuery.isLoading,
    loadError:    schemasQuery.error ? (schemasQuery.error as Error).message : null,

    search,       setSearch,
    filterType,   setFilterType,
    filterActive, setFilterActive,

    loadSchemas, loadStats, refresh,
    patchListItem, removeListItem,
  };
}
