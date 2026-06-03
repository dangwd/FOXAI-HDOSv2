"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Layout, LayoutItem } from "react-grid-layout";
import type { WidgetCatalogEntry, ScreenTabApi } from "@/infrastructure/http/adminApi";
import { adminApi } from "@/infrastructure/http/adminApi";
import { fromApiWidget, makeBlankWidget, findNextY } from "../_lib/widgetUtils";
import { DEFAULT_SIZES } from "../_lib/constants";
import type { DesignerWidget } from "../_lib/types";

const api = adminApi;

export type TabMeta = Pick<ScreenTabApi, "id" | "label">;

export interface DesignerStateReturn {
  // Data
  tabs:           TabMeta[];
  activeTabId:    string;
  widgetsByTab:   Map<string, DesignerWidget[]>;
  widgets:        DesignerWidget[];
  selectedKey:    string | null;
  selectedWidget: DesignerWidget | null;
  gridLayout:     Layout;
  droppingEntry:  WidgetCatalogEntry | null;

  // Save state
  isDirty:     boolean;
  isSaving:    boolean;
  saveSuccess: boolean;
  saveError:   string | null;

  // Layout loading
  layoutLoading: boolean;

  // Tab editing state
  editingTabId: string | null;
  editTabLabel: string;
  isAddingTab:  boolean;
  newTabLabel:  string;

  // Actions — tab
  setActiveTabId:    (id: string) => void;
  setDroppingEntry:  (entry: WidgetCatalogEntry | null) => void;
  setSelectedKey:    (key: string | null) => void;
  startEditTab:      (tab: TabMeta) => void;
  setEditTabLabel:   (v: string) => void;
  commitRenameTab:   (tabId: string) => Promise<void>;
  startAddTab:       () => void;
  setNewTabLabel:    (v: string) => void;
  commitAddTab:      () => Promise<void>;
  cancelAddTab:      () => void;
  handleDeleteTab:   (tabId: string) => Promise<void>;

  // Actions — widget
  handleLayoutChange:    (newLayout: Layout) => void;
  handleAddWidget:       (entry: WidgetCatalogEntry) => void;
  handleCanvasDrop:      (layout: Layout, item: LayoutItem | undefined) => void;
  handleDeleteWidget:    (key: string) => void;
  handleApplyProperties: (updated: DesignerWidget) => void;

  // Actions — save
  handleSave: () => Promise<void>;
}

function splitSlug(selectedSlug: string): [string, string] {
  const idx = selectedSlug.indexOf("/");
  if (idx === -1) return [selectedSlug, ""];
  return [selectedSlug.slice(0, idx), selectedSlug.slice(idx + 1)];
}

export function useDesignerState(selectedSlug: string): DesignerStateReturn {
  // ── Tab state ───────────────────────────────────────────────────────────────
  const [tabs,         setTabs]         = useState<TabMeta[]>([]);
  const [activeTabId,  setActiveTabId]  = useState<string>("");
  const [widgetsByTab, setWidgetsByTab] = useState<Map<string, DesignerWidget[]>>(new Map());
  const [selectedKey,  setSelectedKey]  = useState<string | null>(null);
  const [droppingEntry, setDroppingEntry] = useState<WidgetCatalogEntry | null>(null);

  // ── Tab editing ─────────────────────────────────────────────────────────────
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editTabLabel, setEditTabLabel] = useState("");
  const [isAddingTab,  setIsAddingTab]  = useState(false);
  const [newTabLabel,  setNewTabLabel]  = useState("");

  // ── Layout loading ───────────────────────────────────────────────────────────
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);
  const layoutLoading = Boolean(selectedSlug) && loadedSlug !== selectedSlug;

  // ── Save state ──────────────────────────────────────────────────────────────
  const [isDirty,     setIsDirty]     = useState(false);
  const [isSaving,    setIsSaving]    = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError,   setSaveError]   = useState<string | null>(null);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const widgets        = widgetsByTab.get(activeTabId) ?? [];
  const selectedWidget = selectedKey ? (widgets.find((w) => w.widgetKey === selectedKey) ?? null) : null;

  const gridLayout = useMemo<Layout>(
    () => widgets.map((w) => ({
      i: w.widgetKey,
      x: w.gridX, y: w.gridY, w: w.gridW, h: w.gridH,
      minW: 2, minH: 1,
    })),
    [widgets],
  );

  // ── Load layout when slug changes ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;

    async function run() {
      const [moduleCode, screenCode] = splitSlug(selectedSlug);
      try {
        const layout = await api.getScreenLayout(moduleCode, screenCode);
        if (cancelled) return;

        const validTabs = layout.tabs.filter((t) => t.id);
        if (validTabs.length === 0) {
          let tabId: string;
          const tabLabel = "Tab chính";
          try {
            const created = await api.createScreenTab(moduleCode, screenCode, {
              slug:      "main",
              label:     tabLabel,
              sortOrder: 0,
              isDefault: true,
            });
            if (cancelled) return;
            tabId = created.id;
          } catch {
            if (cancelled) return;
            tabId = `__local_${Date.now().toString(36)}`;
          }
          setSelectedKey(null);
          setTabs([{ id: tabId, label: tabLabel }]);
          setWidgetsByTab(new Map([[tabId, []]]));
          setActiveTabId(tabId);
          setLoadedSlug(selectedSlug);
          setIsDirty(false);
          return;
        }

        const tabList = validTabs.map((t) => ({ id: t.id, label: t.label }));
        const newMap = new Map<string, DesignerWidget[]>();
        validTabs.forEach((t) => newMap.set(t.id, t.widgets.map(fromApiWidget)));
        const defaultTab = validTabs.find((t) => t.isDefault) ?? validTabs[0];
        setSelectedKey(null);
        setTabs(tabList);
        setWidgetsByTab(newMap);
        setActiveTabId(defaultTab.id);
        setLoadedSlug(selectedSlug);
        setIsDirty(false);
      } catch {
        if (cancelled) return;
        const blankId = `tab_${Date.now().toString(36)}`;
        setSelectedKey(null);
        setTabs([{ id: blankId, label: "Tab chính" }]);
        setWidgetsByTab(new Map([[blankId, []]]));
        setActiveTabId(blankId);
        setLoadedSlug(selectedSlug);
        setIsDirty(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [selectedSlug]);

  // ── beforeunload guard ───────────────────────────────────────────────────────
  useEffect(() => {
    function guard(e: BeforeUnloadEvent) {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    }
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [isDirty]);

  // ── Widget mutator helper ────────────────────────────────────────────────────
  function setWidgets(updater: (prev: DesignerWidget[]) => DesignerWidget[]) {
    setWidgetsByTab((prev) => {
      const next = new Map(prev);
      next.set(activeTabId, updater(prev.get(activeTabId) ?? []));
      return next;
    });
    setIsDirty(true);
  }

  // ── Layout change (drag / resize) ────────────────────────────────────────────
  function handleLayoutChange(newLayout: Layout) {
    const current = widgetsByTab.get(activeTabId) ?? [];
    const hasChange = current.some((w) => {
      const li = newLayout.find((l) => l.i === w.widgetKey);
      return li && (li.x !== w.gridX || li.y !== w.gridY || li.w !== w.gridW || li.h !== w.gridH);
    });
    if (!hasChange) return;
    setWidgetsByTab((prev) => {
      const cur = prev.get(activeTabId) ?? [];
      const updated = cur.map((w) => {
        const li = newLayout.find((l) => l.i === w.widgetKey);
        if (!li) return w;
        return { ...w, gridX: li.x, gridY: li.y, gridW: li.w, gridH: li.h };
      });
      const next = new Map(prev);
      next.set(activeTabId, updated);
      return next;
    });
    setIsDirty(true);
  }

  // ── Add widget from catalog (click) ─────────────────────────────────────────
  function handleAddWidget(entry: WidgetCatalogEntry) {
    const w = makeBlankWidget(entry, findNextY(widgets));
    setWidgets((prev) => [...prev, w]);
    setSelectedKey(w.widgetKey);
  }

  // ── Drop widget from catalog → canvas ────────────────────────────────────────
  function handleCanvasDrop(_layout: Layout, item: LayoutItem | undefined) {
    if (!droppingEntry || !item) return;
    const sizes = DEFAULT_SIZES[droppingEntry.widgetType] ?? { w: 6, h: 4 };
    const w: DesignerWidget = {
      ...makeBlankWidget(droppingEntry, 0),
      gridX: item.x, gridY: item.y,
      gridW: droppingEntry.defaultW ?? sizes.w,
      gridH: droppingEntry.defaultH ?? sizes.h,
    };
    setWidgets((prev) => [...prev, w]);
    setSelectedKey(w.widgetKey);
    setDroppingEntry(null);
  }

  function handleDeleteWidget(key: string) {
    setWidgets((prev) => prev.filter((w) => w.widgetKey !== key));
    if (selectedKey === key) setSelectedKey(null);
  }

  function handleApplyProperties(updated: DesignerWidget) {
    setWidgets((prev) => prev.map((w) => w.widgetKey === updated.widgetKey ? updated : w));
  }

  // ── Tab management ───────────────────────────────────────────────────────────
  function startEditTab(tab: TabMeta) {
    setEditingTabId(tab.id);
    setEditTabLabel(tab.label);
  }

  async function commitRenameTab(tabId: string) {
    const label = editTabLabel.trim();
    setEditingTabId(null);
    if (!label) return;
    setTabs((prev) => prev.map((t) => t.id === tabId ? { ...t, label } : t));
    setIsDirty(true);
    if (selectedSlug) {
      const [mc, sc] = splitSlug(selectedSlug);
      api.updateScreenTab(mc, sc, tabId, { label }).catch(() => {});
    }
  }

  function startAddTab() { setIsAddingTab(true); }

  function cancelAddTab() { setIsAddingTab(false); setNewTabLabel(""); }

  async function commitAddTab() {
    const label = newTabLabel.trim();
    setIsAddingTab(false);
    setNewTabLabel("");
    if (!label || !selectedSlug) return;
    const [mc, sc] = splitSlug(selectedSlug);
    try {
      const slug = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "tab";
      const result = await api.createScreenTab(mc, sc, { slug, label, sortOrder: tabs.length });
      setTabs((prev) => [...prev, { id: result.id, label }]);
      setWidgetsByTab((prev) => { const m = new Map(prev); m.set(result.id, []); return m; });
      setActiveTabId(result.id);
      setIsDirty(true);
    } catch {
      const id = `tab_${Date.now().toString(36)}`;
      setTabs((prev) => [...prev, { id, label }]);
      setWidgetsByTab((prev) => { const m = new Map(prev); m.set(id, []); return m; });
      setActiveTabId(id);
      setIsDirty(true);
    }
  }

  async function handleDeleteTab(tabId: string) {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== tabId);
    setTabs(remaining);
    setWidgetsByTab((prev) => { const m = new Map(prev); m.delete(tabId); return m; });
    if (activeTabId === tabId) setActiveTabId(remaining[0].id);
    setIsDirty(true);
    if (selectedSlug) {
      const [mc, sc] = splitSlug(selectedSlug);
      api.deleteScreenTab(mc, sc, tabId).catch(() => {});
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!isDirty || isSaving || !selectedSlug) return;
    const [mc, sc] = splitSlug(selectedSlug);
    setIsSaving(true);
    setSaveError(null);
    try {
      let saveTabId = activeTabId;
      const isLocalTab = !saveTabId || saveTabId.startsWith("__local_");
      if (isLocalTab) {
        const localLabel = tabs.find((t) => t.id === saveTabId)?.label ?? "Tab chính";
        const created = await api.createScreenTab(mc, sc, {
          slug:      "main",
          label:     localLabel,
          sortOrder: 0,
          isDefault: true,
        });
        const oldId = saveTabId;
        saveTabId   = created.id;
        setTabs((prev) => prev.map((t) => t.id === oldId ? { id: saveTabId, label: t.label } : t));
        setWidgetsByTab((prev) => {
          const current = prev.get(oldId) ?? [];
          const m = new Map(prev);
          m.delete(oldId);
          m.set(saveTabId, current);
          return m;
        });
        setActiveTabId(saveTabId);
      }

      const currentWidgets = widgetsByTab.get(activeTabId) ?? widgetsByTab.get(saveTabId) ?? [];
      const payload = currentWidgets.map((w) => ({
        widgetKey:   w.widgetKey,
        widgetType:  w.widgetType,
        gridX:       w.gridX,
        gridY:       w.gridY,
        gridW:       w.gridW,
        gridH:       w.gridH,
        configJson:  w.configJson,
        referenceId: w.referenceId ?? null,
      }));
      await api.saveScreenWidgets(mc, sc, saveTabId, payload);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setSaveError((err as Error).message ?? "Lưu thất bại");
    } finally {
      setIsSaving(false);
    }
  }, [isDirty, isSaving, selectedSlug, activeTabId, widgetsByTab, tabs]);

  return {
    tabs, activeTabId, widgetsByTab, widgets, selectedKey, selectedWidget,
    gridLayout, droppingEntry,
    isDirty, isSaving, saveSuccess, saveError,
    layoutLoading,
    editingTabId, editTabLabel, isAddingTab, newTabLabel,
    setActiveTabId, setDroppingEntry, setSelectedKey,
    startEditTab, setEditTabLabel, commitRenameTab,
    startAddTab, setNewTabLabel, commitAddTab, cancelAddTab, handleDeleteTab,
    handleLayoutChange, handleAddWidget, handleCanvasDrop,
    handleDeleteWidget, handleApplyProperties,
    handleSave,
  };
}
