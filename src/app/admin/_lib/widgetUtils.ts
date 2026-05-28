import type { ApiWidget, WidgetSchemaEntry } from "@/infrastructure/http/adminApi";
import { DEFAULT_SIZES } from "./constants";
import type { DesignerWidget } from "./types";

export function generateKey(chartType: string) {
  return `${chartType}_${Date.now().toString(36)}`;
}

export function findNextY(widgets: DesignerWidget[]): number {
  if (widgets.length === 0) return 0;
  return Math.max(...widgets.map((w) => w.gridY + w.gridH));
}

export function fromApiWidget(w: ApiWidget): DesignerWidget {
  return {
    widgetKey:        w.widgetKey,
    title:            w.title            ?? "",
    subtitle:         w.subtitle         ?? "",
    chartType:        w.chartType,
    gridX:            w.gridX,
    gridY:            w.gridY,
    gridW:            w.gridW,
    gridH:            w.gridH,
    operationPattern: w.operationPattern ?? "",
    providerId:       w.providerId       ?? "",
    paramsTemplate:   w.paramsTemplate,
    visualConfig:     w.visualConfig,
    filterBindings:   w.filterBindings,
    interactions:     w.interactions,
    filterKey:        w.filterKey        ?? "",
  };
}

export function makeBlankWidget(entry: WidgetSchemaEntry, y: number): DesignerWidget {
  const sizes = DEFAULT_SIZES[entry.chartType] ?? { w: 6, h: 4 };
  return {
    widgetKey:        generateKey(entry.chartType),
    title:            entry.label,
    subtitle:         "",
    chartType:        entry.chartType,
    gridX:            0,
    gridY:            y,
    gridW:            sizes.w,
    gridH:            sizes.h,
    operationPattern: "",
    providerId:       "",
    paramsTemplate:   "{}",
    visualConfig:     "{}",
    filterBindings:   [],
    interactions:     "{}",
    filterKey:        "",
  };
}
