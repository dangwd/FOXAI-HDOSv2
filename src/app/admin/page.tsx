"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { useState, useRef, useEffect, useMemo } from "react";
import ReactGridLayout from "react-grid-layout/legacy";
import { Tooltip } from "antd";

import { useAdminData } from "./_hooks/useAdminData";
import { useDesignerState } from "./_hooks/useDesignerState";
import { DEFAULT_SIZES } from "./_lib/constants";

import { PageSkeleton }          from "./_components/PageSkeleton";
import { ModuleRow }              from "./_components/ModuleRow";
import { TabBar }                 from "./_components/TabBar";
import { DesignerCard }           from "./_components/DesignerCard";
import { WidgetCatalogPanel }     from "./_components/WidgetCatalogPanel";
import { WidgetPropertiesPanel }  from "./_components/WidgetPropertiesPanel";
import { IconCheck }              from "./_components/shared";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardDesignerPage() {
  const { modules, catalog, providers, operations, loading, loadError, reload } = useAdminData();

  const [_selectedSlug, setSelectedSlug] = useState<string>("");
  const [search,        setSearch]       = useState<string>("");
  const [rightTab,      setRightTab]     = useState<"palette" | "json">("palette");

  // Derive active slug — auto-select first module once data is loaded, no useEffect needed.
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
  const jsonPreview = JSON.stringify(
    { module: selectedSlug, tabId: designer.activeTabId, widgets: designer.widgets },
    null, 2,
  );

  // ── Render guards ──────────────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 dark:text-[#484f58]">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm font-medium text-gray-600 dark:text-[#8b949e]">{loadError}</p>
        <button
          onClick={reload}
          className="px-4 py-2 text-xs rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Col 1: Module list ─────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 border-r border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-gray-700 dark:text-[#e6edf3]">Modules</span>
          <button className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors">
            + Tạo mới
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {modules.map((mod) => (
            <ModuleRow
              key={mod.slug}
              module={mod}
              active={mod.slug === selectedSlug}
              onClick={() => {
                if (mod.slug !== selectedSlug) {
                  setSelectedSlug(mod.slug);
                }
              }}
            />
          ))}
        </div>
      </aside>

      {/* ── Col 2: Canvas ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Canvas header */}
        <div className="px-5 py-2.5 border-b border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex items-center gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-[#e6edf3] m-0 truncate">
              {selectedModule?.label ?? "—"}
            </h2>
            <p className="text-[11px] text-gray-400 dark:text-[#484f58] m-0">
              GET /api/v1/modules/<code className="text-violet-600 dark:text-violet-400">{selectedSlug}</code>
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
              <span className="text-[11px] text-red-500 shrink-0 max-w-28 truncate">{designer.saveError}</span>
            </Tooltip>
          )}

          <a
            href={`/hdos?module=${selectedSlug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-[#21262d] text-gray-600 dark:text-[#8b949e]
              hover:bg-gray-200 dark:hover:bg-[#30363d] transition-colors shrink-0"
          >
            Xem trực tiếp ↗
          </a>

          <button
            onClick={designer.handleSave}
            disabled={!designer.isDirty || designer.isSaving}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all shrink-0
              ${designer.saveSuccess
                ? "bg-green-500 text-white"
                : designer.isDirty
                  ? "bg-violet-600 hover:bg-violet-700 text-white"
                  : "bg-gray-100 dark:bg-[#21262d] text-gray-400 dark:text-[#484f58] cursor-default"
              }`}
          >
            {designer.isSaving    ? <><span className="animate-spin inline-block">⟳</span> Đang lưu...</>
            : designer.saveSuccess ? <><IconCheck size={12} /> Đã lưu!</>
            :                        "Lưu cấu hình"}
          </button>
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
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]" ref={canvasRef}>
          {designer.layoutLoading ? (
            <div className="p-5 grid grid-cols-3 gap-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-[#0d1117]" />
              ))}
            </div>
          ) : designer.widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400 dark:text-[#484f58] min-h-100">
              <span className="text-5xl select-none">🎨</span>
              <p className="text-sm font-medium m-0 text-gray-600 dark:text-[#8b949e]">Canvas đang trống</p>
              <p className="text-xs m-0 text-center">Kéo widget từ palette bên phải hoặc click để thêm</p>
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
                      x: 0, y: 0,
                      w: DEFAULT_SIZES[designer.droppingEntry.chartType]?.w ?? 6,
                      h: DEFAULT_SIZES[designer.droppingEntry.chartType]?.h ?? 4,
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
                    entry={catalog.find((e) => e.chartType === w.chartType)}
                    onSelect={() =>
                      designer.setSelectedKey(
                        designer.selectedKey === w.widgetKey ? null : w.widgetKey,
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
      <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#0d1117] flex flex-col h-full">
        {designer.selectedWidget ? (
          <WidgetPropertiesPanel
            key={designer.selectedWidget.widgetKey}
            widget={designer.selectedWidget}
            catalog={catalog}
            providers={providers}
            operations={operations}
            onClose={() => designer.setSelectedKey(null)}
            onChange={designer.handleApplyProperties}
          />
        ) : (
          <>
            {/* Sidebar tab switcher */}
            <div className="flex border-b border-gray-200 dark:border-[#30363d] shrink-0">
              {(["palette", "json"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRightTab(t)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                    rightTab === t
                      ? "text-violet-600 dark:text-violet-400 border-b-2 border-violet-600 dark:border-violet-400"
                      : "text-gray-400 dark:text-[#484f58] hover:text-gray-700 dark:hover:text-[#e6edf3]"
                  }`}
                >
                  {t === "palette" ? "Widget Palette" : "JSON Preview"}
                </button>
              ))}
            </div>

            {rightTab === "palette" ? (
              <WidgetCatalogPanel
                catalog={catalog}
                search={search}
                onSearch={setSearch}
                onAdd={designer.handleAddWidget}
                onDragStart={designer.setDroppingEntry}
                onDragEnd={() => designer.setDroppingEntry(null)}
              />
            ) : (
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
