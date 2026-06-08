// Domain types cho LakehouseService — ViewBinding CRUD (doc 44, 47)

import type { ViewBinding, ViewBindingAutoProfileResult } from "@/infrastructure/http/adminApi";

export type { ViewBinding, ViewBindingAutoProfileResult };

/** Giá trị form khi create / edit một ViewBinding */
export interface ViewBindingFormValues {
  viewName:            string;
  sourceSystem:        string;
  recordType:          string;
  businessKeyColumn:   string;
  updatedAtColumn?:    string;   // optional — backend accepts null (doc 47)
  pollIntervalSeconds: number;
  displayName?:        string;   // dùng cho with-auto-profile (tên hiển thị SourceProfile)
}

/** Chuyển ViewBinding → initial form values */
export function bindingToFormValues(b: ViewBinding): ViewBindingFormValues {
  return {
    viewName:            b.viewName,
    sourceSystem:        b.sourceSystem,
    recordType:          b.recordType,
    businessKeyColumn:   b.businessKeyColumn,
    updatedAtColumn:     b.updatedAtColumn || undefined,
    pollIntervalSeconds: b.pollIntervalSeconds,
  };
}
