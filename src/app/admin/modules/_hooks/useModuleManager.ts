"use client";

import { useState, useEffect, useMemo } from "react";
import { App } from "antd";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { AdminModule, ModuleGroupRecord } from "@/infrastructure/http/adminApi";
import { groupColorBySlug } from "../_lib/constants";
import type { ModuleForm } from "../_lib/types";

export function useModuleManager() {
  const { message } = App.useApp();
  const [modules,  setModules]  = useState<AdminModule[]>([]);
  const [groups,   setGroups]   = useState<ModuleGroupRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search,   setSearch]   = useState("");

  const [tick, setTick] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const [data, grps] = await Promise.all([
          adminApi.listModules(),
          adminApi.listModuleGroups(),
        ]);
        const mods = Array.isArray(data) ? data : (data as { items?: AdminModule[] }).items ?? [];
        const groupList = Array.isArray(grps) ? grps : (grps as { items?: ModuleGroupRecord[] }).items ?? [];
        setModules(mods);
        setGroups(groupList.slice().sort((a, b) => a.sortOrder - b.sortOrder));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
        console.error("[ModuleManager] load failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tick]);

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

  // keyed by groupSlug, ordered by groups.sortOrder
  const grouped = useMemo(() => {
    const map = new Map<string, AdminModule[]>();
    for (const g of groups) map.set(g.slug, []);
    for (const m of filtered) {
      const key = m.groupSlug ?? "";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [filtered, groups]);

  function groupColor(groupSlug: string): string {
    return groupColorBySlug(groupSlug, groups);
  }

  async function create(form: ModuleForm): Promise<void> {
    if (!form.groupId || !form.slug.trim() || !form.label.trim()) {
      throw new Error("Thiếu thông tin bắt buộc: nhóm, slug, tên");
    }
    const body = {
      groupId:                form.groupId,
      slug:                   form.slug.trim(),
      label:                  form.label.trim(),
      icon:                   form.icon || form.label.slice(0, 2).toUpperCase(),
      description:            form.description,
      sortOrder:              form.sortOrder,
      requiredRoles:          form.requiredRoles.length ? form.requiredRoles : null,
      isActive:               form.isActive,
      isVisible:              form.isVisible,
      refreshIntervalSeconds: form.refreshIntervalSeconds ? Number(form.refreshIntervalSeconds) : null,
    };
    await adminApi.createModule(body);
    setTick(t => t + 1);
    message.success("Tạo module thành công");
  }

  async function update(id: string, form: ModuleForm): Promise<void> {
    const target = modules.find((m) => m.id === id);
    if (!target) return;
    const body = {
      groupId:                form.groupId,
      slug:                   form.slug.trim(),
      label:                  form.label.trim(),
      icon:                   form.icon || target.icon,
      description:            form.description,
      sortOrder:              form.sortOrder,
      requiredRoles:          form.requiredRoles.length ? form.requiredRoles : null,
      isActive:               form.isActive,
      isVisible:              form.isVisible,
      refreshIntervalSeconds: form.refreshIntervalSeconds ? Number(form.refreshIntervalSeconds) : null,
    };
    await adminApi.updateModule(target.slug, body);
    setTick(t => t + 1);
    message.success("Cập nhật module thành công");
  }

  async function remove(id: string): Promise<void> {
    const target = modules.find((m) => m.id === id);
    if (!target) return;
    await adminApi.deleteModule(target.slug);
    setTick(t => t + 1);
    message.success("Đã xóa module");
  }

  async function toggleActive(id: string): Promise<void> {
    const target = modules.find((m) => m.id === id);
    if (!target) return;
    await adminApi.updateModule(target.slug, { isActive: !(target.isActive ?? true) });
    setTick(t => t + 1);
    message.success("Đã cập nhật trạng thái");
  }

  return { modules, groups, filtered, grouped, loading, loadError, search, setSearch, groupColor, create, update, remove, toggleActive };
}
