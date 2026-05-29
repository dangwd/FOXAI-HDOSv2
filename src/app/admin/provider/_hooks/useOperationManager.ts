"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Operation, OperationForm } from "../_lib/types";
import { MOCK_OPERATIONS } from "../_lib/constants";
import { adminApi, type OperationApiRecord } from "@/infrastructure/http/adminApi";

function apiToOperation(a: OperationApiRecord): Operation {
  return {
    id:              a.id ?? a.operationPattern,
    pattern:         a.operationPattern,
    handler:         a.handlerType as Operation["handler"],
    providerId:      a.providerId ?? "",
    timeoutMs:       a.timeoutMs ?? 30000,
    cacheSeconds:    a.cacheable ? (a.cacheTtlSeconds ?? null) : null,
    idempotent:      a.idempotent ?? true,
    resultChartType: a.resultChartType ?? null,
    status:          (a.status ?? "active") as Operation["status"],
  };
}

function formToApiBody(form: OperationForm): object {
  return {
    operationPattern: form.pattern.trim(),
    handlerType:      form.handler,
    providerId:       form.handler === "provider" ? (form.providerId || undefined) : undefined,
    timeoutMs:        form.timeoutMs,
    cacheable:        form.cacheSeconds !== null,
    cacheTtlSeconds:  form.cacheSeconds,
    idempotent:       form.idempotent,
    resultChartType:  form.resultChartType,
  };
}

export function useOperationManager() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [rev,        setRev]        = useState(0);

  const refresh = useCallback(() => setRev((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    adminApi.listFullOperations()
      .then((data) => {
        if (!cancelled) setOperations(data.map(apiToOperation));
      })
      .catch(() => {
        if (!cancelled) setOperations(MOCK_OPERATIONS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [rev]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return operations;
    return operations.filter(
      (o) => o.pattern.includes(q) || o.providerId.includes(q) || o.handler.includes(q),
    );
  }, [operations, search]);

  async function create(form: OperationForm): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const created = await adminApi.createOperation(formToApiBody(form));
      setOperations((prev) => [apiToOperation(created), ...prev]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Không thể tạo operation";
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, form: OperationForm): Promise<void> {
    const target = operations.find((o) => o.id === id);
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateOperation(target.pattern, {
        ...formToApiBody(form),
        status: form.status,
      });
      setOperations((prev) => prev.map((o) => o.id === id ? apiToOperation(updated) : o));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Không thể cập nhật operation";
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string): Promise<void> {
    const target = operations.find((o) => o.id === id);
    if (!target) return;
    setOperations((prev) => prev.filter((o) => o.id !== id));
    try {
      await adminApi.deleteOperation(target.pattern);
    } catch {
      setOperations((prev) => [target, ...prev]);
    }
  }

  return { operations, filtered, loading, saving, error, search, setSearch, create, update, remove, refresh };
}
