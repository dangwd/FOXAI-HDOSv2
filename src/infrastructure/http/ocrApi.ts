import useAuthStore from "@/core/auth/authStore";
import httpClient from "./httpClient";

// ─── Enums / Literals ─────────────────────────────────────────────────────────

export type DocumentType =
  | "INVOICE"
  | "RECEIPT"
  | "CONTRACT"
  | "STATEMENT"
  | "MINUTES"
  | "WAREHOUSE_RECEIPT"
  | "OTHERS";

export type FieldDataType = "TEXT" | "DATE" | "NUMBER" | "CURRENCY" | "BOOLEAN" | "LIST";

export type FieldPosition = "HEADER" | "BODY" | "FOOTER";

export type OcrDocumentStatus = "DRAFT" | "PROCESSED" | "CONFIRMED" | "TRANSFERRED" | "ERROR";

export type OcrProvider = "gemini" | "claude" | "local-pdf" | "mock";

export type OcrLanguage = "vi" | "en" | "vi+en";

// ─── Schema types ─────────────────────────────────────────────────────────────

export interface OcrSchemaStats {
  totalSchemas: number;
  activeSchemas: number;
  totalFields: number;
  totalTables: number;
}

export interface OcrField {
  id: string;
  fieldKey: string;
  label: string;
  dataType: FieldDataType;
  position: FieldPosition;
  isRequired: boolean;
  displayOrder: number;
}

export interface OcrTableColumn {
  id: string;
  columnKey: string;
  label: string;
  dataType: FieldDataType;
  displayOrder: number;
}

export interface OcrTable {
  id: string;
  tableKey: string;
  name: string;
  columns: OcrTableColumn[];
}

export interface OcrSchemaListItem {
  id: string;
  code: string;
  name: string;
  type: DocumentType;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { fields: number; tables: number; documents: number };
}

export interface OcrSchema extends OcrSchemaListItem {
  fields: OcrField[];
  tables: OcrTable[];
}

// ─── Document types ───────────────────────────────────────────────────────────

/** Giá trị một field OCR đã trích xuất */
export interface DocValue {
  fieldKey: string;
  value: string;
  confidence: number; // 0–1
}

/** Một dòng trong bảng chi tiết (lineItems) */
export interface DocLineItem {
  tableKey: string;
  rowIndex: number;
  values: Record<string, string>; // { name, quantity, unitPrice, amount, ... }
}

export interface OcrDocument {
  id: string;
  status: OcrDocumentStatus;
  documentType: DocumentType;
  schemaCode: string;
  confidence: number;
  fileName: string;
  fileUrl?: string;
  values: DocValue[];
  lineItems: DocLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OcrDocumentListItem {
  id: string;
  status: OcrDocumentStatus;
  documentType: DocumentType;
  schemaCode: string;
  confidence: number;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OcrDocumentListResponse {
  data: OcrDocumentListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface OcrDocumentStats {
  DRAFT: number;
  PROCESSED: number;
  CONFIRMED: number;
  TRANSFERRED: number;
  ERROR: number;
}

export interface OcrUploadResponse {
  documentId: string;
  jobId: string;
  status: string;
  message: string;
}

export interface OcrJobStatus {
  state: "waiting" | "active" | "completed" | "failed" | "not_found";
  progress: number;
  failedReason: string | null;
}

// SSE events — "done" carries documentId only; fetch full doc separately
export type OcrSseEvent =
  | { type: "progress"; progress: number }
  | { type: "done"; documentId: string }
  | { type: "failed"; reason: string };

// ─── API ──────────────────────────────────────────────────────────────────────

export const ocrApi = {

  // ── Schemas ──────────────────────────────────────────────────────────────

  getStats: (): Promise<OcrSchemaStats> =>
    httpClient.get<OcrSchemaStats>("/ocr/schemas/stats").then((r) => r.data),

  listSchemas: (params?: { search?: string; type?: DocumentType; isActive?: boolean }): Promise<OcrSchemaListItem[]> =>
    httpClient.get<OcrSchemaListItem[]>("/ocr/schemas", { params }).then((r) => r.data),

  getSchema: (id: string): Promise<OcrSchema> =>
    httpClient.get<OcrSchema>(`/ocr/schemas/${id}`).then((r) => r.data),

  createSchema: (body: {
    code: string;
    name: string;
    type: DocumentType;
    description?: string;
    fields?: Partial<OcrField>[];
    tables?: { tableKey: string; name: string; columns?: Partial<OcrTableColumn>[] }[];
  }): Promise<OcrSchema> =>
    httpClient.post<OcrSchema>("/ocr/schemas", body).then((r) => r.data),

  updateSchema: (id: string, body: { name?: string; description?: string; isActive?: boolean }): Promise<OcrSchema> =>
    httpClient.patch<OcrSchema>(`/ocr/schemas/${id}`, body).then((r) => r.data),

  deleteSchema: (id: string): Promise<void> =>
    httpClient.delete(`/ocr/schemas/${id}`).then(() => undefined),

  addField: (
    schemaId: string,
    body: { fieldKey: string; label: string; dataType: FieldDataType; position: FieldPosition; isRequired?: boolean; displayOrder?: number },
  ): Promise<OcrField> =>
    httpClient.post<OcrField>(`/ocr/schemas/${schemaId}/fields`, body).then((r) => r.data),

  updateField: (schemaId: string, fieldId: string, body: Partial<OcrField>): Promise<OcrField> =>
    httpClient.patch<OcrField>(`/ocr/schemas/${schemaId}/fields/${fieldId}`, body).then((r) => r.data),

  deleteField: (schemaId: string, fieldId: string): Promise<void> =>
    httpClient.delete(`/ocr/schemas/${schemaId}/fields/${fieldId}`).then(() => undefined),

  addTable: (
    schemaId: string,
    body: { tableKey: string; name: string; columns?: Partial<OcrTableColumn>[] },
  ): Promise<OcrTable> =>
    httpClient.post<OcrTable>(`/ocr/schemas/${schemaId}/tables`, body).then((r) => r.data),

  updateTable: (schemaId: string, tableId: string, body: { name?: string }): Promise<OcrTable> =>
    httpClient.patch<OcrTable>(`/ocr/schemas/${schemaId}/tables/${tableId}`, body).then((r) => r.data),

  deleteTable: (schemaId: string, tableId: string): Promise<void> =>
    httpClient.delete(`/ocr/schemas/${schemaId}/tables/${tableId}`).then(() => undefined),

  addColumn: (
    schemaId: string,
    tableId: string,
    body: { columnKey: string; label: string; dataType: FieldDataType; displayOrder?: number },
  ): Promise<OcrTableColumn> =>
    httpClient.post<OcrTableColumn>(`/ocr/schemas/${schemaId}/tables/${tableId}/columns`, body).then((r) => r.data),

  deleteColumn: (schemaId: string, tableId: string, columnId: string): Promise<void> =>
    httpClient.delete(`/ocr/schemas/${schemaId}/tables/${tableId}/columns/${columnId}`).then(() => undefined),

  // ── Documents ─────────────────────────────────────────────────────────────

  /** POST /documents/upload — multipart: files, schemaCode, provider, language */
  uploadDocuments: (formData: FormData): Promise<OcrUploadResponse> =>
    httpClient.post<OcrUploadResponse>("/ocr/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
    }).then((r) => r.data),

  getDocumentStats: (): Promise<OcrDocumentStats> =>
    httpClient.get<OcrDocumentStats>("/ocr/documents/stats").then((r) => r.data),

  listDocuments: (params?: {
    status?: OcrDocumentStatus;
    schemaCode?: string;
    page?: number;
    limit?: number;
  }): Promise<OcrDocumentListResponse> =>
    httpClient.get<OcrDocumentListResponse>("/ocr/documents", { params }).then((r) => r.data),

  getDocument: (id: string): Promise<OcrDocument> =>
    httpClient.get<OcrDocument>(`/ocr/documents/${id}`).then((r) => r.data),

  /** Returns the URL for streaming the original file (use in <img> or <iframe>) */
  getFileUrl: (id: string): string => {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");
    const token = useAuthStore.getState().accessToken;
    return token
      ? `${base}/ocr/documents/${id}/file?access_token=${encodeURIComponent(token)}`
      : `${base}/ocr/documents/${id}/file`;
  },

  /** PATCH /documents/:id — update values and/or lineItems */
  updateDocument: (
    id: string,
    body: {
      values?: { fieldKey: string; value: string }[];
      lineItems?: DocLineItem[];
    },
  ): Promise<OcrDocument> =>
    httpClient.patch<OcrDocument>(`/ocr/documents/${id}`, body).then((r) => r.data),

  /** POST /documents/:id/confirm → status: CONFIRMED */
  confirmDocument: (id: string): Promise<OcrDocument> =>
    httpClient.post<OcrDocument>(`/ocr/documents/${id}/confirm`).then((r) => r.data),

  /** POST /documents/:id/transfer → status: TRANSFERRED (requires CONFIRMED) */
  transferDocument: (id: string): Promise<OcrDocument> =>
    httpClient.post<OcrDocument>(`/ocr/documents/${id}/transfer`).then((r) => r.data),

  /** DELETE /documents/:id — only DRAFT, PROCESSED, ERROR */
  deleteDocument: (id: string): Promise<void> =>
    httpClient.delete(`/ocr/documents/${id}`).then(() => undefined),

  getJobStatus: (id: string): Promise<OcrJobStatus> =>
    httpClient.get<OcrJobStatus>(`/ocr/documents/${id}/job-status`).then((r) => r.data),

  bulkConfirm: (ids: string[]): Promise<void> =>
    httpClient.post("/ocr/documents/bulk-confirm", { ids }).then(() => undefined),

  bulkTransfer: (ids: string[]): Promise<void> =>
    httpClient.post("/ocr/documents/bulk-transfer", { ids }).then(() => undefined),

  bulkDelete: (ids: string[]): Promise<void> =>
    httpClient.post("/ocr/documents/bulk-delete", { ids }).then(() => undefined),
};

/** SSE URL for real-time OCR progress — token passed as query param (EventSource has no custom headers) */
export function getDocumentSseUrl(documentId: string): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");
  const token = useAuthStore.getState().accessToken;
  return token
    ? `${base}/ocr/documents/${documentId}/sse?access_token=${encodeURIComponent(token)}`
    : `${base}/ocr/documents/${documentId}/sse`;
}
