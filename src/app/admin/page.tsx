"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { Button, Tooltip } from "antd";
import { Check, Palette, Save } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import ReactGridLayout from "react-grid-layout/legacy";

import { useAdminData } from "./_hooks/useAdminData";
import { useDesignerState } from "./_hooks/useDesignerState";
import { DEFAULT_SIZES } from "./_lib/constants";

import { DataSourcesPanel } from "./_components/DataSourcesPanel";
import { DesignerCard } from "./_components/DesignerCard";
import { ModuleRow } from "./_components/ModuleRow";
import { PageSkeleton } from "./_components/PageSkeleton";
import { TabBar } from "./_components/TabBar";
import { WidgetCatalogPanel } from "./_components/WidgetCatalogPanel";
import { WidgetPropertiesPanel } from "./_components/WidgetPropertiesPanel";

// ─── Main page ────────────────────────────────────────────────────────────────

function DashboardDesignerInner() {
  const {
    modules,
    catalog,
    loading,
  } = useAdminData();
  const searchParams = useSearchParams();

  const slugParam   = searchParams.get("slug") ?? "";
  const screenParam = searchParams.get("screen") ?? "";
  const [_selectedSlug, setSelectedSlug] = useState<string>(
    screenParam ? `${slugParam}/${screenParam}` : slugParam,
  );
  const [search, setSearch] = useState<string>("");
  const [rightTab, setRightTab] = useState<"palette" | "datasources" | "json">("palette");

  const selectedSlug = useMemo(
    () => _selectedSlug || modules[0]?.slug || "",
    [_selectedSlug, modules],
  );

  const designer = useDesignerState(selectedSlug);

  // ── Canvas width tracking ──────────────────────────────────────────────────
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(900);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setCanvasWidth(w);
    });
    ro.observe(el);
    setCanvasWidth(el.clientWidth || 900);
    return () => ro.disconnect();
  }, [loading, designer.layoutLoading]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedModule = modules.find((m) => m.slug === selectedSlug);

  // Group modules by groupSlug — mỗi group là một "module", mỗi item là một "page"
  const groupedModules = useMemo(() => {
    const map = new Map<string, { groupSlug: string; groupLabel: string; items: typeof modules }>();
    for (const mod of modules) {
      const key   = mod.groupSlug || "__ungrouped";
      const label = mod.groupLabel || "Chưa phân nhóm";
      if (!map.has(key)) map.set(key, { groupSlug: key, groupLabel: label, items: [] });
      map.get(key)!.items.push(mod);
    }
    return [...map.values()];
  }, [modules]);
  const jsonPreview = JSON.stringify(
    {
      module: selectedSlug,
      tabId: designer.activeTabId,
      widgets: designer.widgets,
    },
    null,
    2,
  );

  // ── Render guards ──────────────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;

  // if (loadError) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 dark:text-[#484f58]">
  //       <AlertTriangle size={36} className="text-gray-400" />
  //       <p className="text-sm font-medium text-gray-600 dark:text-[#8b949e]">{loadError}</p>
  //       <Button icon={<RefreshCw size={14} />} onClick={reload} type="primary">
  //         Thử lại
  //       </Button>
  //     </div>
  //   );
  // }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Col 1: Module list ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#1f2937] shrink-0">
          <span className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3]">
            Pages
          </span>
          <p className="text-[10px] text-gray-400 dark:text-[#484f58] m-0 mt-0.5">
            {modules.length} page · {groupedModules.length} module
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {groupedModules.map((group) => (
            <div key={group.groupSlug} className="mb-1">
              {/* Module header (nhóm) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-[#484f58] truncate">
                  {group.groupLabel}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-[#1f2937]" />
                <span className="text-[9px] text-gray-300 dark:text-[#30363d] font-mono shrink-0">
                  {group.items.length}
                </span>
              </div>
              {/* Pages trong module */}
              <div className="px-1.5 space-y-0.5">
                {group.items.map((mod) => (
                  <ModuleRow
                    key={mod.slug}
                    module={mod}
                    active={mod.slug === selectedSlug}
                    onClick={() => {
                      if (mod.slug !== selectedSlug) setSelectedSlug(mod.slug);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Col 2: Canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Canvas header */}
        <div className="px-5 py-2.5 border-b border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {selectedModule?.groupLabel && (
                <>
                  <span className="text-[11px] text-gray-400 dark:text-[#484f58] truncate">
                    {selectedModule.groupLabel}
                  </span>
                  <span className="text-[11px] text-gray-300 dark:text-[#30363d]">/</span>
                </>
              )}
              <h2 className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 truncate">
                {selectedModule?.label ?? "—"}
              </h2>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0">
              GET /forms/pages/
              <code className="text-emerald-600 dark:text-emerald-400">
                {selectedSlug}
              </code>
              <span className="mx-1">·</span>
              {designer.widgets.length} widget
            </p>
          </div>

          {designer.isDirty && !designer.isSaving && !designer.saveSuccess && (
            <span className="text-[11px] text-amber-500 dark:text-amber-400 font-medium shrink-0">
              • Chưa lưu
            </span>
          )}
          {designer.saveError && (
            <Tooltip title={designer.saveError} placement="bottom">
              <span className="text-[11px] text-red-500 shrink-0 max-w-28 truncate">
                {designer.saveError}
              </span>
            </Tooltip>
          )}

          <a
            href={`/forms/pages/${selectedSlug}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="small">Xem trực tiếp ↗</Button>
          </a>

          <Button
            type="primary"
            size="small"
            icon={
              designer.saveSuccess ? <Check size={14} /> : <Save size={14} />
            }
            loading={designer.isSaving}
            disabled={!designer.isDirty || designer.isSaving}
            onClick={designer.handleSave}
            style={
              designer.saveSuccess
                ? { background: "#22c55e", borderColor: "#22c55e" }
                : undefined
            }
          >
            {designer.isSaving
              ? "Đang lưu..."
              : designer.saveSuccess
                ? "Đã lưu!"
                : "Lưu cấu hình"}
          </Button>
        </div>

        {/* Tab bar */}
        {designer.tabs.length > 0 && (
          <TabBar
            tabs={designer.tabs}
            activeId={designer.activeTabId}
            editingId={designer.editingTabId}
            editLabel={designer.editTabLabel}
            isAdding={designer.isAddingTab}
            newLabel={designer.newTabLabel}
            onSelect={designer.setActiveTabId}
            onStartEdit={designer.startEditTab}
            onEditChange={designer.setEditTabLabel}
            onEditCommit={designer.commitRenameTab}
            onDelete={designer.handleDeleteTab}
            onStartAdd={designer.startAddTab}
            onNewLabelChange={designer.setNewTabLabel}
            onAddCommit={designer.commitAddTab}
            onAddCancel={designer.cancelAddTab}
          />
        )}

        {/* Canvas body */}
        <div
          className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]"
          ref={canvasRef}
        >
          {designer.layoutLoading ? (
            <div className="p-5 grid grid-cols-3 gap-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-gray-100 dark:bg-[#0a0f1a]"
                />
              ))}
            </div>
          ) : designer.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-[#484f58] min-h-100">
              <Palette
                size={40}
                className="text-gray-300 dark:text-[#30363d]"
              />
              <p className="text-sm font-medium m-0 text-gray-600 dark:text-[#8b949e]">
                Canvas đang trống
              </p>
              <p className="text-xs m-0 text-center">
                Kéo widget từ palette bên phải hoặc click để thêm
              </p>
            </div>
          ) : (
            <ReactGridLayout
              layout={designer.gridLayout}
              cols={12}
              rowHeight={60}
              width={canvasWidth}
              margin={[8, 8]}
              containerPadding={[16, 16]}
              draggableHandle=".drag-handle"
              onLayoutChange={designer.handleLayoutChange}
              resizeHandles={["se"]}
              isDroppable={true}
              droppingItem={
                designer.droppingEntry
                  ? {
                      i: "__dropping",
                      x: 0,
                      y: 0,
                      w: designer.droppingEntry.defaultW ?? DEFAULT_SIZES[designer.droppingEntry.widgetType]?.w ?? 6,
                      h: designer.droppingEntry.defaultH ?? DEFAULT_SIZES[designer.droppingEntry.widgetType]?.h ?? 4,
                    }
                  : undefined
              }
              onDrop={designer.handleCanvasDrop}
            >
              {designer.widgets.map((w) => (
                <div key={w.widgetKey}>
                  <DesignerCard
                    widget={w}
                    selected={designer.selectedKey === w.widgetKey}
                    entry={catalog.find((e) => e.widgetType === w.widgetType)}
                    onSelect={() =>
                      designer.setSelectedKey(
                        designer.selectedKey === w.widgetKey
                          ? null
                          : w.widgetKey,
                      )
                    }
                    onDelete={() => designer.handleDeleteWidget(w.widgetKey)}
                  />
                </div>
              ))}
            </ReactGridLayout>
          )}
        </div>
      </div>

      {/* ── Col 3: Right sidebar ───────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex flex-col h-full">
        {designer.selectedWidget ? (
          <WidgetPropertiesPanel
            key={designer.selectedWidget.widgetKey}
            widget={designer.selectedWidget}
            catalog={catalog}
            onClose={() => designer.setSelectedKey(null)}
            onChange={designer.handleApplyProperties}
          />
        ) : (
          <>
            {/* Sidebar tab switcher */}
            <div className="flex border-b border-gray-200 dark:border-[#1f2937] shrink-0">
              {([
                { key: "palette",     label: "Palette" },
                { key: "datasources", label: "DataSources" },
                { key: "json",        label: "JSON" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setRightTab(t.key)}
                  className={`flex-1 py-2.5 text-[11px] font-medium transition-colors ${
                    rightTab === t.key
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                      : "text-gray-400 dark:text-[#484f58] hover:text-gray-700 dark:hover:text-[#e6edf3]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {rightTab === "palette" && (
              <WidgetCatalogPanel
                catalog={catalog}
                search={search}
                onSearch={setSearch}
                onAdd={designer.handleAddWidget}
                onDragStart={designer.setDroppingEntry}
                onDragEnd={() => designer.setDroppingEntry(null)}
              />
            )}
            {rightTab === "datasources" && (
              <DataSourcesPanel selectedSlug={selectedSlug} />
            )}
            {rightTab === "json" && (
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#010409]">
                <pre className="font-mono text-[10px] text-gray-700 dark:text-[#e6edf3] whitespace-pre-wrap leading-relaxed m-0">
                  {jsonPreview}
                </pre>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

export default function DashboardDesignerPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardDesignerInner />
    </Suspense>
  );
}
