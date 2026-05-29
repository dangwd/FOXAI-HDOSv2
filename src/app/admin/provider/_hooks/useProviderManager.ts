"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { MOCK_PROVIDERS } from "../_lib/constants";
import type { Provider, ProviderForm, ProviderStatus } from "../_lib/types";
import { adminApi, type ProviderApiRecord } from "@/infrastructure/http/adminApi";

export type StatusFilter = ProviderStatus | "all";

function apiToProvider(a: ProviderApiRecord): Provider {
  return {
    id:                    a.id ?? a.providerId,
    providerId:            a.providerId,
    displayName:           a.displayName,
    description:           a.description,
    clientId:              a.clientId,
    operations:            a.operations ?? [],
    timeoutMs:             a.timeoutMs ?? 30000,
    priority:              a.priority ?? 5,
    status:                (a.status ?? "active") as ProviderStatus,
    circuitBreaker:        a.circuitBreaker ?? { failureThreshold: 5, windowSeconds: 60, cooldownSeconds: 30 },
    maxConcurrentRequests: a.maxConcurrentRequests ?? 8,
    createdAt:             a.createdAt ?? new Date().toISOString(),
    lastConnectedAt:       a.lastConnectedAt,
  };
}

function formToOps(form: ProviderForm): string[] {
  return form.operationsText.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function useProviderManager() {
  const [providers,    setProviders]    = useState<Provider[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rev,          setRev]          = useState(0);

  const reload = useCallback(() => setRev((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.listFullProviders();
        if (!cancelled) setProviders(data.map(apiToProvider));
      } catch {
        if (!cancelled) setProviders(MOCK_PROVIDERS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [rev]);

  const filtered = useMemo(() => {
    let list = providers;
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    const q = search.toLowerCase().trim();
    if (q) list = list.filter(
      (p) =>
        p.providerId.toLowerCase().includes(q) ||
        p.displayName.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.operations.some((op) => op.includes(q)),
    );
    return list;
  }, [providers, search, statusFilter]);

  async function create(form: ProviderForm): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      const created = await adminApi.createProvider({
        providerId:            form.providerId,
        displayName:           form.displayName,
        description:           form.description || undefined,
        clientId:              form.clientId || form.providerId,
        clientSecret:          form.clientSecret,
        operations:            formToOps(form),
        timeoutMs:             form.timeoutMs,
        priority:              form.priority,
        maxConcurrentRequests: form.maxConcurrentRequests,
        circuitBreaker: {
          failureThreshold: form.cbFailureThreshold,
          windowSeconds:    form.cbWindowSeconds,
          cooldownSeconds:  form.cbCooldownSeconds,
        },
      });
      setProviders((prev) => [apiToProvider(created), ...prev]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Không thể tạo provider";
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, form: ProviderForm): Promise<void> {
    const target = providers.find((p) => p.id === id);
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await adminApi.updateProvider(target.providerId, {
        displayName:           form.displayName,
        description:           form.description || undefined,
        operations:            formToOps(form),
        timeoutMs:             form.timeoutMs,
        priority:              form.priority,
        status:                form.status,
        maxConcurrentRequests: form.maxConcurrentRequests,
        circuitBreaker: {
          failureThreshold: form.cbFailureThreshold,
          windowSeconds:    form.cbWindowSeconds,
          cooldownSeconds:  form.cbCooldownSeconds,
        },
      });
      setProviders((prev) => prev.map((p) => p.id === id ? apiToProvider(updated) : p));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Không thể cập nhật provider";
      setError(msg);
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function remove(id: string): void {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  async function setStatus(id: string, status: ProviderStatus): Promise<void> {
    const target = providers.find((p) => p.id === id);
    if (!target) return;
    setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status } : p));
    try {
      await adminApi.updateProvider(target.providerId, { status });
    } catch {
      setProviders((prev) => prev.map((p) => p.id === id ? { ...p, status: target.status } : p));
    }
  }

  return {
    providers, filtered, loading, saving, error,
    search, setSearch, statusFilter, setStatusFilter,
    create, update, remove, setStatus, reload,
  };
}
