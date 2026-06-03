"use client";

import { useState, useEffect, useCallback } from "react";
import type { DocumentType, OcrSchema, OcrSchemaListItem, OcrSchemaStats } from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";

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

  loadSchemas: () => void;
  loadStats:   () => void;
  refresh:     () => void;

  patchListItem: (updated: OcrSchema) => void;
  removeListItem: (id: string) => void;
}

export function useSchemaData(): UseSchemaDataReturn {
  const [schemas,      setSchemas]      = useState<OcrSchemaListItem[]>([]);
  const [stats,        setStats]        = useState<OcrSchemaStats | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadError,    setLoadError]    = useState<string | null>(null);

  const [search,       setSearch]       = useState("");
  const [filterType,   setFilterType]   = useState<DocumentType | undefined>();
  const [filterActive, setFilterActive] = useState<boolean | undefined>();

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await ocrApi.getStats());
    } catch {
      // non-critical
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadSchemas = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params: { search?: string; type?: DocumentType; isActive?: boolean } = {};
      if (search.trim())           params.search   = search.trim();
      if (filterType)              params.type     = filterType;
      if (filterActive !== undefined) params.isActive = filterActive;
      setSchemas(await ocrApi.listSchemas(params));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Tải danh sách thất bại");
    } finally {
      setLoading(false);
    }
  }, [search, filterType, filterActive]);

  useEffect(() => {
    loadSchemas();
    loadStats();
  }, [loadSchemas, loadStats]);

  const refresh = useCallback(() => {
    loadSchemas();
    loadStats();
  }, [loadSchemas, loadStats]);

  const patchListItem = useCallback((updated: OcrSchema) => {
    setSchemas((prev) =>
      prev.map((s) =>
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
      ),
    );
  }, []);

  const removeListItem = useCallback((id: string) => {
    setSchemas((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    schemas, stats, loading, statsLoading, loadError,
    search, filterType, filterActive,
    setSearch, setFilterType, setFilterActive,
    loadSchemas, loadStats, refresh,
    patchListItem, removeListItem,
  };
}
