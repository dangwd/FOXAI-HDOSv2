"use client";

import { useState, useMemo } from "react";
import type { Operation, OperationForm } from "../_lib/types";
import { MOCK_OPERATIONS } from "../_lib/constants";

export function useOperationManager() {
  const [operations, setOperations] = useState<Operation[]>(MOCK_OPERATIONS);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return operations;
    return operations.filter(
      (o) => o.pattern.includes(q) || o.providerId.includes(q) || o.handler.includes(q),
    );
  }, [operations, search]);

  function create(form: OperationForm) {
    const op: Operation = {
      id: `op-${Date.now()}`,
      pattern:      form.pattern.trim(),
      handler:      form.handler,
      providerId:   form.providerId,
      timeoutMs:    form.timeoutMs,
      cacheSeconds: form.cacheSeconds,
      status:       form.status,
    };
    setOperations((prev) => [op, ...prev]);
  }

  function update(id: string, form: OperationForm) {
    setOperations((prev) =>
      prev.map((o) =>
        o.id !== id ? o : {
          ...o,
          pattern:      form.pattern.trim(),
          handler:      form.handler,
          providerId:   form.providerId,
          timeoutMs:    form.timeoutMs,
          cacheSeconds: form.cacheSeconds,
          status:       form.status,
        },
      ),
    );
  }

  function remove(id: string) {
    setOperations((prev) => prev.filter((o) => o.id !== id));
  }

  function refresh() {
    setOperations([...MOCK_OPERATIONS]);
  }

  return { operations, filtered, search, setSearch, create, update, remove, refresh };
}
