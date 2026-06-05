"use client";

import { useState } from "react";
import type { WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import type { DesignerStateReturn } from "../_hooks/useDesignerState";
import { DataSourcesPanel } from "./DataSourcesPanel";
import { FieldBrowser } from "./FieldBrowser";
import { WidgetCatalogPanel } from "./WidgetCatalogPanel";
import { WidgetPropertiesPanel } from "./WidgetPropertiesPanel";

type RightTab = "palette" | "datasources" | "json";

const TABS: { key: RightTab; label: string }[] = [
  { key: "palette",     label: "Palette" },
  { key: "datasources", label: "DataSources" },
  { key: "json",        label: "JSON" },
];

interface Props {
  designer:     DesignerStateReturn;
  catalog:      WidgetCatalogEntry[];
  selectedSlug: string;
}

export function RightSidebar({ designer, catalog, selectedSlug }: Props) {
  const [activeTab, setActiveTab] = useState<RightTab>("palette");
  const [search,    setSearch]    = useState("");

  const jsonPreview = JSON.stringify(
    { module: selectedSlug, tabId: designer.activeTabId, widgets: designer.widgets },
    null,
    2,
  );

  return (
    <aside className="w-72 shrink-0 border-l border-gray-200 dark:border-[#1f2937] bg-white dark:bg-[#0a0f1a] flex flex-col h-full overflow-hidden">

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">

        {/* Widget properties — replaces tab panel when a widget is selected */}
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
            {/* Tab switcher */}
            <div className="flex border-b border-gray-200 dark:border-[#1f2937] shrink-0">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2.5 text-[11px] font-medium transition-colors cursor-pointer
                    ${activeTab === t.key
                      ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                      : "text-gray-400 dark:text-[#484f58] hover:text-gray-700 dark:hover:text-[#e6edf3]"
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Panel content */}
            {activeTab === "palette" && (
              <WidgetCatalogPanel
                catalog={catalog}
                search={search}
                onSearch={setSearch}
                onAdd={designer.handleAddWidget}
                onDragStart={designer.setDroppingEntry}
                onDragEnd={() => designer.setDroppingEntry(null)}
              />
            )}
            {activeTab === "datasources" && (
              <DataSourcesPanel selectedSlug={selectedSlug} />
            )}
            {activeTab === "json" && (
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-[#010409]">
                <pre className="font-mono text-[10px] text-gray-700 dark:text-[#e6edf3] whitespace-pre-wrap leading-relaxed m-0">
                  {jsonPreview}
                </pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* Field browser — only visible when a widget is selected */}
      {designer.selectedWidget && (
        <FieldBrowser selectedSlug={selectedSlug} />
      )}
    </aside>
  );
}
