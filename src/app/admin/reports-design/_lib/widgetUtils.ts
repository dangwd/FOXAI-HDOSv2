import type { ScreenWidgetApi, WidgetCatalogEntry } from "@/infrastructure/http/adminApi";
import { DEFAULT_SIZES } from "./constants";
import type { DesignerWidget } from "./types";

export function generateKey(widgetType: string) {
  return `${widgetType}_${Date.now().toString(36)}`;
}

export function findNextY(widgets: DesignerWidget[]): number {
  if (widgets.length === 0) return 0;
  return Math.max(...widgets.map((w) => w.gridY + w.gridH));
}

export function fromApiWidget(w: ScreenWidgetApi): DesignerWidget {
  return {
    widgetKey:   w.widgetKey,
    widgetType:  w.widgetType,
    label:       w.widgetType,
    gridX:       w.gridX,
    gridY:       w.gridY,
    gridW:       w.gridW,
    gridH:       w.gridH,
    configJson:  w.configJson ?? "{}",
    referenceId: w.referenceId ?? null,
  };
}

export function makeBlankWidget(entry: WidgetCatalogEntry, y: number): DesignerWidget {
  const sizes = DEFAULT_SIZES[entry.widgetType] ?? { w: 6, h: 4 };
  return {
    widgetKey:   generateKey(entry.widgetType),
    widgetType:  entry.widgetType,
    label:       entry.label,
    gridX:       0,
    gridY:       y,
    gridW:       entry.defaultW ?? sizes.w,
    gridH:       entry.defaultH ?? sizes.h,
    configJson:  "{}",
    referenceId: null,
  };
}
