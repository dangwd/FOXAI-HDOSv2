"use client";

import { useState, useCallback } from "react";
import type { OcrSchema, OcrSchemaListItem } from "@/infrastructure/http/ocrApi";
import { ocrApi } from "@/infrastructure/http/ocrApi";

export interface UseSchemaEditReturn {
  schema:      OcrSchema | null;
  loading:     boolean;
  open:        (record: OcrSchemaListItem) => Promise<void>;
  close:       () => void;
  update:      (updated: OcrSchema) => void;
}

export function useSchemaEdit(): UseSchemaEditReturn {
  const [schema,  setSchema]  = useState<OcrSchema | null>(null);
  const [loading, setLoading] = useState(false);

  const open = useCallback(async (record: OcrSchemaListItem) => {
    setLoading(true);
    try {
      const full = await ocrApi.getSchema(record.id);
      setSchema(full);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(() => setSchema(null), []);

  const update = useCallback((updated: OcrSchema) => setSchema(updated), []);

  return { schema, loading, open, close, update };
}
