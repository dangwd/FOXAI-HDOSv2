"use client";

import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { OcrSchema, OcrSchemaListItem } from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";

export interface UseSchemaEditReturn {
  schema:  OcrSchema | null;
  loading: boolean;
  open:    (record: OcrSchemaListItem) => Promise<void>;
  close:   () => void;
  update:  (updated: OcrSchema) => void;
}

const schemaDetailKey = (id: string | null) =>
  ["ocr", "schema-detail", id] as const;

export function useSchemaEdit(): UseSchemaEditReturn {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isFetching } = useQuery({
    queryKey: schemaDetailKey(selectedId),
    queryFn:  () => ocrApi.getSchema(selectedId!),
    enabled:  !!selectedId,
    staleTime: 60_000,
  });

  // Khi đóng modal (selectedId = null), data từ cache vẫn còn — dùng selectedId làm guard
  const schema = selectedId ? (data ?? null) : null;

  const open = useCallback(async (record: OcrSchemaListItem) => {
    setSelectedId(record.id);
  }, []);

  const close = useCallback(() => {
    setSelectedId(null);
  }, []);

  // Cập nhật cache trực tiếp — phản ánh ngay khi user chỉnh local trước khi save
  const update = useCallback((updated: OcrSchema) => {
    queryClient.setQueryData(schemaDetailKey(selectedId), updated);
  }, [queryClient, selectedId]);

  return { schema, loading: isFetching, open, close, update };
}
