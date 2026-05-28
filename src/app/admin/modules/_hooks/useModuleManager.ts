"use client";

import { useState, useMemo } from "react";
import type { AdminModule, ModuleGroup } from "@/infrastructure/http/adminApi";
import { MOCK_MODULES } from "../../_lib/mockData";
import { GROUP_ORDER } from "../_lib/constants";
import type { ModuleForm } from "../_lib/types";

export function useModuleManager() {
  const [modules, setModules] = useState<AdminModule[]>(MOCK_MODULES);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        (m.description ?? "").toLowerCase().includes(q),
    );
  }, [modules, search]);

  const grouped = useMemo(() => {
    const map = new Map<ModuleGroup, AdminModule[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const m of filtered) {
      const g = m.group ?? "dieu-hanh";
      map.get(g)?.push(m);
    }
    return map;
  }, [filtered]);

  function create(form: ModuleForm) {
    setModules((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        slug: form.slug,
        label: form.label,
        icon: form.icon || form.label.slice(0, 2).toUpperCase(),
        description: form.description,
        sortOrder: form.sortOrder,
        group: form.group as ModuleGroup,
        roles: form.roles,
        isActive: form.isActive,
        isVisible: form.isVisible,
        refreshInterval: form.refreshInterval ? Number(form.refreshInterval) : undefined,
      },
    ]);
  }

  function update(id: string, form: ModuleForm) {
    setModules((prev) =>
      prev.map((m) =>
        m.id !== id
          ? m
          : {
              ...m,
              slug: form.slug,
              label: form.label,
              icon: form.icon || m.icon,
              description: form.description,
              sortOrder: form.sortOrder,
              group: form.group as ModuleGroup,
              roles: form.roles,
              isActive: form.isActive,
              isVisible: form.isVisible,
              refreshInterval: form.refreshInterval ? Number(form.refreshInterval) : undefined,
            },
      ),
    );
  }

  function remove(id: string) {
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  function toggleActive(id: string) {
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !(m.isActive ?? true) } : m)),
    );
  }

  return { modules, filtered, grouped, search, setSearch, create, update, remove, toggleActive };
}
