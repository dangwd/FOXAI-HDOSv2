import httpProvider from "./httpForProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetCategory = "visualization" | "healthcare" | "filter" | "layout" | "ai";
export type ModuleGroup    = "dieu-hanh" | "lam-sang" | "quan-tri";

export interface AdminModule {
  id: string;
  slug: string;
  label: string;
  icon: string;
  description: string;
  sortOrder: number;
  group?: ModuleGroup;
  roles?: string[];
  isActive?: boolean;
  isVisible?: boolean;
  refreshInterval?: number;
}

export interface WidgetSchemaEntry {
  chartType: string;
  category: WidgetCategory;
  label: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
}

export interface OperationEntry {
  pattern: string;
  providerId: string;
}

export interface ApiWidget {
  widgetKey: string;
  title?: string;
  subtitle?: string;
  chartType: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  operationPattern?: string;
  providerId?: string;
  paramsTemplate: string;
  visualConfig: string;
  filterBindings: string[];
  interactions: string;
  filterKey?: string;
}

export interface ModuleTabApi {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  widgets: ApiWidget[];
}

export interface ModuleLayout {
  slug: string;
  label: string;
  description?: string;
  tabs: ModuleTabApi[];
}

export interface UpsertWidgetRequest {
  widgetKey: string;
  title?: string;
  subtitle?: string;
  chartType: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  operationPattern?: string;
  providerId?: string;
  paramsTemplate: string;
  visualConfig: string;
  filterBindings: string[];
  interactions: string;
  filterKey?: string;
}

// ─── Provider / Operation record types ───────────────────────────────────────

export interface ProviderApiRecord {
  id: string;
  providerId: string;
  displayName: string;
  description?: string;
  clientId: string;
  operations: string[];
  timeoutMs: number;
  priority: number;
  status: string;
  circuitBreaker: {
    failureThreshold: number;
    windowSeconds: number;
    cooldownSeconds: number;
  };
  maxConcurrentRequests: number;
  createdAt: string;
  lastConnectedAt?: string;
}

export interface OperationApiRecord {
  id: string;
  operationPattern: string;
  handlerType: string;
  providerId?: string;
  timeoutMs: number;
  cacheable: boolean;
  cacheTtlSeconds: number | null;
  idempotent: boolean;
  resultChartType: string | null;
  status: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────
// baseURL is already set to <NEXT_PUBLIC_API_URL>/api/v1 in httpProvider.
// All paths below are relative to that base (leading "/" stripped by Axios combineURLs).

export const adminApi = {

  // ── Modules ──────────────────────────────────────────────────────────────

  listModules: (): Promise<AdminModule[]> =>
    httpProvider.get<AdminModule[]>("/admin/modules").then((r) => r.data),

  createModule: (body: object): Promise<AdminModule> =>
    httpProvider.post<AdminModule>("/admin/modules", body).then((r) => r.data),

  updateModule: (slug: string, body: object): Promise<AdminModule> =>
    httpProvider.put<AdminModule>(`/admin/modules/${slug}`, body).then((r) => r.data),

  deleteModule: (slug: string): Promise<void> =>
    httpProvider.delete(`/admin/modules/${slug}`).then(() => undefined),

  listSchemas: (): Promise<WidgetSchemaEntry[]> =>
    httpProvider.get<WidgetSchemaEntry[]>("/admin/schemas").then((r) => r.data),

  listProviders: (): Promise<ProviderInfo[]> =>
    httpProvider.get<ProviderApiRecord[]>("/admin/providers").then((r) =>
      r.data.map((p) => ({ id: p.providerId, name: p.displayName })),
    ),

  listOperations: (): Promise<OperationEntry[]> =>
    httpProvider.get<OperationApiRecord[]>("/admin/operations").then((r) =>
      r.data.map((op) => ({ pattern: op.operationPattern, providerId: op.providerId ?? "" })),
    ),

  getModuleLayout: (slug: string): Promise<ModuleLayout> =>
    httpProvider.get<ModuleLayout>(`/modules/${slug}/layout`).then((r) => r.data),

  // ── Tabs ─────────────────────────────────────────────────────────────────

  createTab: (
    slug: string,
    body: { slug: string; label: string; sortOrder: number },
  ): Promise<{ id: string; slug: string }> =>
    httpProvider
      .post<{ id: string; slug: string }>(`/admin/modules/${slug}/tabs`, body)
      .then((r) => r.data),

  updateTab: (slug: string, tabId: string, body: { label?: string; sortOrder?: number }): Promise<void> =>
    httpProvider.put(`/admin/modules/${slug}/tabs/${tabId}`, body).then(() => undefined),

  deleteTab: (slug: string, tabId: string): Promise<void> =>
    httpProvider.delete(`/admin/modules/${slug}/tabs/${tabId}`).then(() => undefined),

  // ── Widgets ───────────────────────────────────────────────────────────────

  saveWidgets: (
    slug: string,
    tabId: string,
    widgets: UpsertWidgetRequest[],
  ): Promise<{ saved: number }> =>
    httpProvider
      .put<{ saved: number }>(`/admin/modules/${slug}/tabs/${tabId}/widgets`, widgets)
      .then((r) => r.data),

  // ── Provider CRUD ─────────────────────────────────────────────────────────

  listFullProviders: (): Promise<ProviderApiRecord[]> =>
    httpProvider.get<ProviderApiRecord[]>("/admin/providers").then((r) => r.data),

  createProvider: (body: object): Promise<ProviderApiRecord> =>
    httpProvider.post<ProviderApiRecord>("/admin/providers", body).then((r) => r.data),

  updateProvider: (providerId: string, body: object): Promise<ProviderApiRecord> =>
    httpProvider.put<ProviderApiRecord>(`/admin/providers/${providerId}`, body).then((r) => r.data),

  deleteProvider: (providerId: string): Promise<void> =>
    httpProvider.delete(`/admin/providers/${providerId}`).then(() => undefined),

  // ── Operation CRUD ────────────────────────────────────────────────────────

  listFullOperations: (): Promise<OperationApiRecord[]> =>
    httpProvider.get<OperationApiRecord[]>("/admin/operations").then((r) => r.data),

  createOperation: (body: object): Promise<OperationApiRecord> =>
    httpProvider.post<OperationApiRecord>("/admin/operations", body).then((r) => r.data),

  updateOperation: (pattern: string, body: object): Promise<OperationApiRecord> =>
    httpProvider.put<OperationApiRecord>(`/admin/operations/${encodeURIComponent(pattern)}`, body).then((r) => r.data),

  deleteOperation: (pattern: string): Promise<void> =>
    httpProvider.delete(`/admin/operations/${encodeURIComponent(pattern)}`).then(() => undefined),
};
