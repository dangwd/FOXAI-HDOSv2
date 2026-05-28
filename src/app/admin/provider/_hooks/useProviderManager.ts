"use client";

import { useState, useMemo } from "react";
import { MOCK_PROVIDERS } from "../_lib/constants";
import type { Provider, ProviderForm, ProviderStatus } from "../_lib/types";

export type StatusFilter = ProviderStatus | "all";

export function useProviderManager() {
  const [providers, setProviders] = useState<Provider[]>(MOCK_PROVIDERS);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("all");

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

  function create(form: ProviderForm): void {
    const ops = form.operationsText.split("\n").map((s) => s.trim()).filter(Boolean);
    setProviders((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        providerId:  form.providerId,
        displayName: form.displayName,
        description: form.description || undefined,
        clientId:    form.clientId || form.providerId,
        operations:  ops,
        timeoutMs:   form.timeoutMs,
        priority:    form.priority,
        status:      form.status,
        circuitBreaker: {
          failureThreshold: form.cbFailureThreshold,
          windowSeconds:    form.cbWindowSeconds,
          cooldownSeconds:  form.cbCooldownSeconds,
        },
        maxConcurrentRequests: form.maxConcurrentRequests,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  function update(id: string, form: ProviderForm): void {
    const ops = form.operationsText.split("\n").map((s) => s.trim()).filter(Boolean);
    setProviders((prev) =>
      prev.map((p) =>
        p.id !== id ? p : {
          ...p,
          displayName: form.displayName,
          description: form.description || undefined,
          operations:  ops,
          timeoutMs:   form.timeoutMs,
          priority:    form.priority,
          status:      form.status,
          circuitBreaker: {
            failureThreshold: form.cbFailureThreshold,
            windowSeconds:    form.cbWindowSeconds,
            cooldownSeconds:  form.cbCooldownSeconds,
          },
          maxConcurrentRequests: form.maxConcurrentRequests,
        },
      ),
    );
  }

  function remove(id: string): void {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  }

  function setStatus(id: string, status: ProviderStatus): void {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p)),
    );
  }

  return {
    providers, filtered, search, setSearch, statusFilter, setStatusFilter,
    create, update, remove, setStatus,
  };
}
