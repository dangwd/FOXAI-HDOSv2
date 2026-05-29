"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/infrastructure/http/adminApi";
import type { AdminMenuNode, AdminScreen, AdminPermission, AdminWidgetDef } from "@/infrastructure/http/adminApi";
import type { DesignerState, DesignerWidget, MenuUpsertForm } from "../_lib/types";

function apiWidgetToDesigner(w: AdminWidgetDef): DesignerWidget {
  let parsed: Record<string, unknown> = {};
  try { parsed = JSON.parse(w.config); } catch { /* keep empty */ }
  return {
    id:          w.id,
    type:        w.widgetType,
    title:       w.title,
    span:        w.colSpan,
    color:       w.color,
    ds:          w.dataSource ?? "",
    xField:      parsed.xField as string | undefined,
    yField:      parsed.yField as string | undefined,
    valField:    parsed.valField as string | undefined,
    trendField:  parsed.trendField as string | undefined,
    catField:    parsed.catField as string | undefined,
    cols:        parsed.cols as string[] | undefined,
  };
}

export function useMenuManager() {
  const [menus,    setMenus]    = useState<AdminMenuNode[]>([]);
  const [screens,  setScreens]  = useState<AdminScreen[]>([]);
  const [perms,    setPerms]    = useState<AdminPermission[]>([]);
  const [selId,    setSelId]    = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [tab,      setTab]      = useState<"screens" | "perms" | "info">("screens");
  const [designer, setDesigner] = useState<DesignerState | null>(null);
  const [infoEdit, setInfoEdit] = useState<Partial<MenuUpsertForm> | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminApi.listAdminMenus();
        setMenus(data);
        if (data.length > 0) setSelId(data[0].id);
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Load screens + perms when selection changes ───────────────────────────
  useEffect(() => {
    if (!selId) return;
    let cancelled = false;

    async function load() {
      try {
        const [sc, pm] = await Promise.all([
          adminApi.listScreens(selId!),
          adminApi.listPerms(selId!),
        ]);
        if (cancelled) return;
        setScreens(sc);
        setPerms(pm);
        setInfoEdit(null);
      } catch {
        if (cancelled) return;
        setScreens([]);
        setPerms([]);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [selId]);

  // ── Tree helpers ──────────────────────────────────────────────────────────
  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  }

  function selectMenu(id: string) {
    setSelId(id);
    setTab("screens");
  }

  // ── Menu CRUD ──────────────────────────────────────────────────────────────
  async function createMenu(form: MenuUpsertForm): Promise<void> {
    const created = await adminApi.createMenu(form);
    setMenus((prev) => [...prev, created]);
    setSelId(created.id);
    setTab("screens");
  }

  async function updateMenuInfo(partial: Partial<MenuUpsertForm>): Promise<void> {
    if (!selId) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.updateMenu(selId, partial);
      setMenus((prev) => prev.map((m) =>
        m.id === selId
          ? { ...m, ...(partial as Partial<AdminMenuNode>) }
          : m,
      ));
      setInfoEdit(null);
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Lưu thất bại");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  async function deleteMenu(id: string): Promise<void> {
    await adminApi.deleteMenu(id);
    setMenus((prev) => prev.filter((m) => m.id !== id));
    if (selId === id) setSelId(null);
  }

  // ── Screen CRUD ────────────────────────────────────────────────────────────
  async function createScreen(
    name: string,
    icon: string,
    refreshMode = "none",
    refreshIntervalS = 60,
  ): Promise<void> {
    if (!selId) return;
    const created = await adminApi.createScreen(selId, {
      name, icon, status: "draft", sortOrder: screens.length, refreshMode, refreshIntervalS,
    });
    setScreens((prev) => [...prev, created]);
    setMenus((prev) => prev.map((m) => m.id === selId ? { ...m, screenCount: m.screenCount + 1 } : m));
  }

  async function deleteScreen(screenId: string): Promise<void> {
    if (!selId) return;
    await adminApi.deleteScreen(selId, screenId);
    setScreens((prev) => prev.filter((s) => s.id !== screenId));
    setMenus((prev) => prev.map((m) => m.id === selId ? { ...m, screenCount: Math.max(0, m.screenCount - 1) } : m));
  }

  // ── Designer open/close ────────────────────────────────────────────────────
  const openDesigner = useCallback(async (screen: AdminScreen) => {
    if (!selId) return;
    const menu = menus.find((m) => m.id === selId);
    if (!menu) return;
    try {
      const rawWidgets = await adminApi.listWidgets(selId, screen.id);
      setDesigner({
        menuId:           selId,
        screenId:         screen.id,
        screenName:       screen.name,
        screenIcon:       screen.icon,
        refreshMode:      screen.refreshMode,
        refreshIntervalS: screen.refreshIntervalS,
        widgets:          rawWidgets.map(apiWidgetToDesigner),
        selWgId:          null,
        palDs:            "",
      });
    } catch {
      setDesigner({
        menuId:           selId,
        screenId:         screen.id,
        screenName:       screen.name,
        screenIcon:       screen.icon,
        refreshMode:      "none",
        refreshIntervalS: 60,
        widgets:          [],
        selWgId:          null,
        palDs:            "",
      });
    }
  }, [selId, menus]);

  async function saveDesigner(): Promise<void> {
    if (!designer) return;
    setSaving(true);
    setError(null);
    try {
      const widgets = designer.widgets.map((w, i) => ({
        widgetType:       w.type,
        title:            w.title,
        colSpan:          w.span,
        sortOrder:        i,
        color:            w.color,
        dataSource:       w.ds || null,
        config:           JSON.stringify({
          xField:     w.xField,
          yField:     w.yField,
          valField:   w.valField,
          trendField: w.trendField,
          catField:   w.catField,
          cols:       w.cols,
        }),
      }));
      const result = await adminApi.saveScreen(designer.menuId, designer.screenId!, {
        name:             designer.screenName,
        icon:             designer.screenIcon,
        status:           "published",
        refreshMode:      designer.refreshMode,
        refreshIntervalS: designer.refreshIntervalS,
        widgets,
      });
      // Refresh screens list
      const sc = await adminApi.listScreens(designer.menuId);
      setScreens(sc);
      setDesigner(null);
      return result as unknown as void;
    } catch (err: unknown) {
      setError((err as Error)?.message ?? "Lưu thất bại");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  function closeDesigner() { setDesigner(null); }

  // ── Permission CRUD ────────────────────────────────────────────────────────
  async function addPerm(principalType: "role" | "user", principalValue: string): Promise<void> {
    if (!selId) return;
    const created = await adminApi.upsertPerm(selId, {
      principalType, principalValue, canView: true, canExport: false,
    });
    setPerms((prev) => {
      const idx = prev.findIndex(
        (p) => p.principalType === principalType && p.principalValue === principalValue,
      );
      return idx >= 0 ? prev.map((p, i) => i === idx ? created : p) : [...prev, created];
    });
  }

  async function togglePerm(permId: string, field: "canView" | "canExport"): Promise<void> {
    if (!selId) return;
    const target = perms.find((p) => p.id === permId);
    if (!target) return;
    const next = { ...target, [field]: !target[field] };
    setPerms((prev) => prev.map((p) => p.id === permId ? next : p));
    try {
      await adminApi.updatePerm(selId, permId, { [field]: next[field] });
    } catch {
      setPerms((prev) => prev.map((p) => p.id === permId ? target : p));
    }
  }

  async function deletePerm(permId: string): Promise<void> {
    if (!selId) return;
    setPerms((prev) => prev.filter((p) => p.id !== permId));
    try {
      await adminApi.deletePerm(selId, permId);
    } catch {
      const sc = await adminApi.listPerms(selId).catch(() => []);
      setPerms(sc);
    }
  }

  const selectedMenu = menus.find((m) => m.id === selId) ?? null;

  return {
    menus, screens, perms, selId, expanded, tab, designer, infoEdit, loading, saving, error,
    selectedMenu,
    selectMenu, toggleExpand, setTab,
    createMenu, updateMenuInfo, deleteMenu,
    createScreen, deleteScreen,
    openDesigner, saveDesigner, closeDesigner, setDesigner,
    addPerm, togglePerm, deletePerm,
    setInfoEdit,
  };
}
