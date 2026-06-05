"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { Button, Tooltip } from "antd";
import { Check, Palette, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactGridLayout from "react-grid-layout/legacy";

import type { AdminModule, WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import type { DesignerStateReturn } from "../_hooks/useDesignerState";
import { DEFAULT_SIZES } from "../_lib/constants";
import { DesignerCard } from "./DesignerCard";
import { TabBar } from "./TabBar";

interface Props {
  selectedSlug:   string;
  selectedModule: AdminModule | undefined;
  designer:       DesignerStateReturn;
  catalog:        WidgetCatalogEntry[];
}

export function CanvasArea({ selectedSlug, selectedModule, designer, catalog }: Props) {
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
  }, [designer.layoutLoading]);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
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
            <code className="text-emerald-600 dark:text-emerald-400">{selectedSlug}</code>
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
            <span className="text-[11px] text-red-500 shrink-0 max-w-28 truncate cursor-help">
              {designer.saveError}
            </span>
          </Tooltip>
        )}

        <a href={`/forms/pages/${selectedSlug}`} target="_blank" rel="noreferrer">
          <Button size="small">Xem trực tiếp ↗</Button>
        </a>

        <Button
          type="primary"
          size="small"
          icon={designer.saveSuccess ? <Check size={14} /> : <Save size={14} />}
          loading={designer.isSaving}
          disabled={!designer.isDirty || designer.isSaving}
          onClick={designer.handleSave}
          style={designer.saveSuccess ? { background: "#22c55e", borderColor: "#22c55e" } : undefined}
        >
          {designer.isSaving ? "Đang lưu..." : designer.saveSuccess ? "Đã lưu!" : "Lưu cấu hình"}
        </Button>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
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

      {/* ── Canvas body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#010409]" ref={canvasRef}>
        {designer.layoutLoading ? (
          <div className="p-5 grid grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-gray-100 dark:bg-[#0a0f1a]" />
            ))}
          </div>
        ) : designer.widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 min-h-100
            text-gray-400 dark:text-[#484f58]">
            <Palette size={40} className="text-gray-300 dark:text-[#30363d]" />
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
  );
}
