// Domain types cho LakehouseService — ViewBinding CRUD (doc 44)

import type { ViewBinding } from "@/infrastructure/http/adminApi";

// Re-export để các component trong module này không phải import từ adminApi trực tiếp
export type { ViewBinding };

/** Giá trị form khi create / edit một ViewBinding */
export interface ViewBindingFormValues {
  viewName:            string;
  sourceSystem:        string;
  recordType:          string;
  businessKeyColumn:   string;
  updatedAtColumn:     string;
  pollIntervalSeconds: number;
}

/** Chuyển ViewBinding → initial form values */
export function bindingToFormValues(b: ViewBinding): ViewBindingFormValues {
  return {
    viewName:            b.viewName,
    sourceSystem:        b.sourceSystem,
    recordType:          b.recordType,
    businessKeyColumn:   b.businessKeyColumn,
    updatedAtColumn:     b.updatedAtColumn,
    pollIntervalSeconds: b.pollIntervalSeconds,
  };
}
