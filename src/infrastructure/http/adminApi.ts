import httpClient from "./httpClient";

// ─── Types ────────────────────────────────────────────────────────────────────

// ── Menu / Report-screen types ────────────────────────────────────────────────

export interface AdminMenuNode {
  id:           string;
  name:         string;
  slug:         string;
  icon:         string;
  description:  string | null;
  parentId:     string | null;
  sortOrder:    number;
  isVisible:    boolean;
  createdAt:    string;
  updatedAt:    string;
  screenCount:  number;
}

export interface AdminScreen {
  id:               string;
  name:             string;
  icon:             string;
  status:           "draft" | "published";
  sortOrder:        number;
  widgetCount:      number;
  refreshMode:      "none" | "timer" | "sse";
  refreshIntervalS: number;
}

export interface AdminPermission {
  id:             string;
  principalType:  "role" | "user";
  principalValue: string;
  canView:        boolean;
  canExport:      boolean;
}

export interface AdminWidgetDef {
  id:          string;
  widgetType:  "kpi" | "line" | "bar" | "pie" | "table" | "text";
  title:       string;
  colSpan:     number;
  sortOrder:   number;
  color:       string;
  dataSource:  string | null;
  config:      string;
}

export type WidgetCategory = "visualization" | "healthcare" | "filter" | "layout" | "ai";

export interface ModuleGroupRecord {
  id:        string;
  slug:      string;
  label:     string;
  icon:      string | null;
  sortOrder: number;
}

export interface AdminModule {
  id:                     string;
  groupId?:               string;   // UUID — present in create/update responses, absent in list
  groupSlug:              string;   // present in list response
  groupLabel:             string;   // present in list response
  slug:                   string;
  label:                  string;
  icon:                   string;
  description:            string;
  sortOrder:              number;
  requiredRoles:          string[] | null;
  isActive:               boolean;
  isVisible:              boolean;
  refreshIntervalSeconds: number | null;
}

export interface WidgetSchemaEntry {
  chartType: string;
  category: WidgetCategory;
  label: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

// ── DynamicFormService types ──────────────────────────────────────────────────

export interface FormsModule {
  id:           string;
  code:         string;
  name:         string;
  description?: string;
  status:       "active" | "inactive";
  formCount:    number;
  createdAtUtc: string;
}

export interface FormTemplateListItem {
  id:         string;
  moduleCode: string;
  key:        string;
  name:       string;
  status:     "draft" | "published" | "archived";
  version:    number;
}

export interface FormPageListItem {
  id:         string;
  moduleCode: string;
  code:       string;
  title:      string;
  status:     "draft" | "published" | "archived";
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
// baseURL is NEXT_PUBLIC_API_URL (no /api/v1 suffix).
// DynamicFormService paths start with /forms/...
// Other admin paths start with /admin/...

// Helper: DynamicFormService wraps responses in { success, data }.
// Falls back to treating the body directly if it's already the expected shape.
function unwrapForms<T>(body: { success?: boolean; data?: T } | T): T {
  if (body !== null && typeof body === "object" && "success" in (body as object)) {
    return (body as { success: boolean; data: T }).data;
  }
  return body as T;
}

export const adminApi = {

  // ── DynamicFormService modules ────────────────────────────────────────────

  listFormsModules: (): Promise<FormsModule[]> =>
    httpClient
      .get<{ success: boolean; data: FormsModule[] } | FormsModule[]>("/forms/modules")
      .then((r) => unwrapForms<FormsModule[]>(r.data)),

  createFormsModule: (body: { code: string; name: string; description?: string }): Promise<FormsModule> =>
    httpClient
      .post<{ success: boolean; data: FormsModule } | FormsModule>("/forms/admin/modules", body)
      .then((r) => unwrapForms<FormsModule>(r.data)),

  listForms: (moduleCode: string): Promise<FormTemplateListItem[]> =>
    httpClient
      .get<{ success: boolean; data: FormTemplateListItem[] } | FormTemplateListItem[]>(`/forms/${moduleCode}`)
      .then((r) => unwrapForms<FormTemplateListItem[]>(r.data)),

  listPages: (moduleCode: string): Promise<FormPageListItem[]> =>
    httpClient
      .get<{ success: boolean; data: FormPageListItem[] } | FormPageListItem[]>(`/forms/pages/${moduleCode}`)
      .then((r) => unwrapForms<FormPageListItem[]>(r.data)),

  createForm: (
    moduleCode: string,
    body: { key: string; name: string; submitButtonLabel?: string; allowMultipleSubmissions?: boolean },
  ): Promise<FormTemplateListItem> =>
    httpClient
      .post<{ success: boolean; data: FormTemplateListItem } | FormTemplateListItem>(
        `/forms/admin/modules/${moduleCode}/forms`,
        body,
      )
      .then((r) => unwrapForms<FormTemplateListItem>(r.data)),

  createPage: (
    moduleCode: string,
    body: { code: string; title: string },
  ): Promise<FormPageListItem> =>
    httpClient
      .post<{ success: boolean; data: FormPageListItem } | FormPageListItem>(
        `/forms/admin/modules/${moduleCode}/pages`,
        body,
      )
      .then((r) => unwrapForms<FormPageListItem>(r.data)),

  // layout is arbitrary JSON object per api-v3 spec (FormPageLayout)
  updatePageLayout: (pageId: string, layout: object): Promise<void> =>
    httpClient
      .put(`/forms/admin/pages/${pageId}/layout`, { layout })
      .then(() => undefined),

  publishPage: (pageId: string): Promise<void> =>
    httpClient
      .post(`/forms/admin/pages/${pageId}/publish`)
      .then(() => undefined),

  // Returns the hydrated page schema (Published pages only; 404 for Draft)
  getPageSchema: (
    moduleCode: string,
    pageCode: string,
  ): Promise<{ rows: unknown[] }> =>
    httpClient
      .get<{ success?: boolean; data?: { rows: unknown[] }; rows?: unknown[] }>(
        `/forms/pages/${moduleCode}/${pageCode}`,
      )
      .then((r) => {
        const body = r.data;
        if (body && "success" in body && body.data) return body.data as { rows: unknown[] };
        return body as { rows: unknown[] };
      }),

  // ── Widget layout modules (canvas designer) ───────────────────────────────

  listModules: (): Promise<AdminModule[]> =>
    httpClient.get<AdminModule[]>("/admin/modules").then((r) => r.data),

  listSchemas: (): Promise<WidgetSchemaEntry[]> =>
    httpClient.get<WidgetSchemaEntry[]>("/admin/schemas").then((r) => r.data),

  listProviders: (): Promise<ProviderInfo[]> =>
    httpClient.get<ProviderApiRecord[]>("/admin/providers").then((r) =>
      r.data.map((p) => ({ id: p.providerId, name: p.displayName })),
    ),

  listOperations: (): Promise<OperationEntry[]> =>
    httpClient.get<OperationApiRecord[]>("/admin/operations").then((r) =>
      r.data.map((op) => ({ pattern: op.operationPattern, providerId: op.providerId ?? "" })),
    ),

  getModuleLayout: (slug: string): Promise<ModuleLayout> =>
    httpClient.get<ModuleLayout>(`/modules/${slug}/layout`).then((r) => r.data),

  // ── Tabs ─────────────────────────────────────────────────────────────────

  createTab: (
    slug: string,
    body: { slug: string; label: string; sortOrder: number },
  ): Promise<{ id: string; slug: string }> =>
    httpClient
      .post<{ id: string; slug: string }>(`/admin/modules/${slug}/tabs`, body)
      .then((r) => r.data),

  updateTab: (slug: string, tabId: string, body: { label?: string; sortOrder?: number }): Promise<void> =>
    httpClient.put(`/admin/modules/${slug}/tabs/${tabId}`, body).then(() => undefined),

  deleteTab: (slug: string, tabId: string): Promise<void> =>
    httpClient.delete(`/admin/modules/${slug}/tabs/${tabId}`).then(() => undefined),

  // ── Widgets ───────────────────────────────────────────────────────────────

  saveWidgets: (
    slug: string,
    tabId: string,
    widgets: UpsertWidgetRequest[],
  ): Promise<{ saved: number }> =>
    httpClient
      .put<{ saved: number }>(`/admin/modules/${slug}/tabs/${tabId}/widgets`, widgets)
      .then((r) => r.data),

  // ── Provider CRUD ─────────────────────────────────────────────────────────

  listFullProviders: (): Promise<ProviderApiRecord[]> =>
    httpClient.get<ProviderApiRecord[]>("/admin/providers").then((r) => r.data),

  createProvider: (body: object): Promise<ProviderApiRecord> =>
    httpClient.post<ProviderApiRecord>("/admin/providers", body).then((r) => r.data),

  updateProvider: (providerId: string, body: object): Promise<ProviderApiRecord> =>
    httpClient.put<ProviderApiRecord>(`/admin/providers/${providerId}`, body).then((r) => r.data),

  deleteProvider: (providerId: string): Promise<void> =>
    httpClient.delete(`/admin/providers/${providerId}`).then(() => undefined),

  // ── Operation CRUD ────────────────────────────────────────────────────────

  listFullOperations: (): Promise<OperationApiRecord[]> =>
    httpClient.get<OperationApiRecord[]>("/admin/operations").then((r) => r.data),

  createOperation: (body: object): Promise<OperationApiRecord> =>
    httpClient.post<OperationApiRecord>("/admin/operations", body).then((r) => r.data),

  updateOperation: (pattern: string, body: object): Promise<OperationApiRecord> =>
    httpClient.put<OperationApiRecord>(`/admin/operations/${encodeURIComponent(pattern)}`, body).then((r) => r.data),

  deleteOperation: (pattern: string): Promise<void> =>
    httpClient.delete(`/admin/operations/${encodeURIComponent(pattern)}`).then(() => undefined),

  // ── Menu CRUD ─────────────────────────────────────────────────────────────

  listAdminMenus: (): Promise<AdminMenuNode[]> =>
    httpClient.get<AdminMenuNode[]>("/admin/menus").then((r) => r.data),

  createMenu: (body: object): Promise<AdminMenuNode> =>
    httpClient.post<AdminMenuNode>("/admin/menus", body).then((r) => r.data),

  updateMenu: (id: string, body: object): Promise<void> =>
    httpClient.put(`/admin/menus/${id}`, body).then(() => undefined),

  deleteMenu: (id: string): Promise<void> =>
    httpClient.delete(`/admin/menus/${id}`).then(() => undefined),

  // ── Screen CRUD ───────────────────────────────────────────────────────────

  listScreens: (menuId: string): Promise<AdminScreen[]> =>
    httpClient.get<AdminScreen[]>(`/admin/menus/${menuId}/screens`).then((r) => r.data),

  createScreen: (menuId: string, body: object): Promise<AdminScreen> =>
    httpClient.post<AdminScreen>(`/admin/menus/${menuId}/screens`, body).then((r) => r.data),

  updateScreen: (menuId: string, screenId: string, body: object): Promise<void> =>
    httpClient.put(`/admin/menus/${menuId}/screens/${screenId}`, body).then(() => undefined),

  deleteScreen: (menuId: string, screenId: string): Promise<void> =>
    httpClient.delete(`/admin/menus/${menuId}/screens/${screenId}`).then(() => undefined),

  saveScreen: (
    menuId: string,
    screenId: string,
    body: object,
  ): Promise<{ id: string; savedAt: string }> =>
    httpClient
      .put<{ id: string; savedAt: string }>(`/admin/menus/${menuId}/screens/${screenId}/save`, body)
      .then((r) => r.data),

  // ── Widget individual CRUD ────────────────────────────────────────────────

  listWidgets: (menuId: string, screenId: string): Promise<AdminWidgetDef[]> =>
    httpClient
      .get<AdminWidgetDef[]>(`/admin/menus/${menuId}/screens/${screenId}/widgets`)
      .then((r) => r.data),

  // ── Permission CRUD ───────────────────────────────────────────────────────

  listPerms: (menuId: string): Promise<AdminPermission[]> =>
    httpClient.get<AdminPermission[]>(`/admin/menus/${menuId}/permissions`).then((r) => r.data),

  upsertPerm: (menuId: string, body: object): Promise<AdminPermission> =>
    httpClient.post<AdminPermission>(`/admin/menus/${menuId}/permissions`, body).then((r) => r.data),

  updatePerm: (menuId: string, permId: string, body: object): Promise<void> =>
    httpClient.put(`/admin/menus/${menuId}/permissions/${permId}`, body).then(() => undefined),

  deletePerm: (menuId: string, permId: string): Promise<void> =>
    httpClient.delete(`/admin/menus/${menuId}/permissions/${permId}`).then(() => undefined),
};
