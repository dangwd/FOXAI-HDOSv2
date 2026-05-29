"use client";

import { useState, useEffect, useMemo } from "react";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { AdminModule, ModuleGroup } from "@/infrastructure/http/adminApi";
import { GROUP_ORDER } from "../_lib/constants";
import type { ModuleForm } from "../_lib/types";

export function useModuleManager() {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminApi.listModules();
        setModules(data);
      } catch {
        // keep empty on failure
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  async function create(form: ModuleForm) {
    const body = {
      slug:            form.slug,
      label:           form.label,
      icon:            form.icon || form.label.slice(0, 2).toUpperCase(),
      description:     form.description,
      sortOrder:       form.sortOrder,
      group:           form.group,
      roles:           form.roles,
      isActive:        form.isActive,
      isVisible:       form.isVisible,
      refreshInterval: form.refreshInterval ? Number(form.refreshInterval) : undefined,
    };
    const created = await adminApi.createModule(body);
    setModules((prev) => [...prev, created]);
  }

  async function update(id: string, form: ModuleForm) {
    const target = modules.find((m) => m.id === id);
    if (!target) return;
    const body = {
      slug:            form.slug,
      label:           form.label,
      icon:            form.icon || target.icon,
      description:     form.description,
      sortOrder:       form.sortOrder,
      group:           form.group,
      roles:           form.roles,
      isActive:        form.isActive,
      isVisible:       form.isVisible,
      refreshInterval: form.refreshInterval ? Number(form.refreshInterval) : undefined,
    };
    const updated = await adminApi.updateModule(target.slug, body);
    setModules((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  async function remove(id: string) {
    const target = modules.find((m) => m.id === id);
    if (!target) return;
    await adminApi.deleteModule(target.slug);
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  async function toggleActive(id: string) {
    const target = modules.find((m) => m.id === id);
    if (!target) return;
    const updated = await adminApi.updateModule(target.slug, { isActive: !(target.isActive ?? true) });
    setModules((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }

  return { modules, filtered, grouped, loading, search, setSearch, create, update, remove, toggleActive };
}
