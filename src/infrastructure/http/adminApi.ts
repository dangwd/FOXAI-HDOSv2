import httpClient from "./httpClient";

// ─── Types ────────────────────────────────────────────────────────────────────

// ── Menu / Report-screen types ────────────────────────────────────────────────

export interface AdminMenuNode {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  screenCount: number;
}

export interface AdminScreen {
  id: string;
  name: string;
  icon: string;
  status: "draft" | "published";
  sortOrder: number;
  widgetCount: number;
  refreshMode: "none" | "timer" | "sse";
  refreshIntervalS: number;
}

export interface AdminPermission {
  id: string;
  principalType: "role" | "user";
  principalValue: string;
  canView: boolean;
  canExport: boolean;
}

export interface AdminWidgetDef {
  id: string;
  widgetType: "kpi" | "line" | "bar" | "pie" | "table" | "text";
  title: string;
  colSpan: number;
  sortOrder: number;
  color: string;
  dataSource: string | null;
  config: string;
}

export type WidgetCategory =
  | "visualization"
  | "healthcare"
  | "filter"
  | "layout"
  | "ai";

export interface ModuleGroupRecord {
  id: string;
  slug: string;
  label: string;
  icon: string | null;
  sortOrder: number;
}

export interface AdminModule {
  id: string;
  groupId?: string; // UUID — present in create/update responses, absent in list
  groupSlug: string; // present in list response
  groupLabel: string; // present in list response
  slug: string;
  label: string;
  icon: string;
  description: string;
  sortOrder: number;
  requiredRoles: string[] | null;
  isActive: boolean;
  isVisible: boolean;
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
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "Active" | "Inactive";
  formCount: number;
  screenCount: number;
  createdAtUtc: string;
}

export interface FormTemplateListItem {
  id: string;
  moduleCode: string;
  key: string;
  name: string;
  status: "Draft" | "Published" | "Archived";
  version: number;
}

export interface FormPageListItem {
  id: string;
  moduleCode: string;
  code: string;
  title: string;
  description: string | null;
  status: "Draft" | "Published" | "Archived";
  sortOrder: number;
  tabCount: number;
  createdAtUtc: string;
}

// ── Screen Designer types (replaces FormPage) ─────────────────────────────────

export interface FormScreen {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: "Draft" | "Published" | "Archived";
  sortOrder: number;
}

export interface ScreenWidgetApi {
  widgetKey: string;
  widgetType: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  configJson: string | null;
  referenceId: string | null;
}

export interface ScreenTabApi {
  id: string;
  label: string;
  slug: string;
  isDefault: boolean;
  sortOrder: number;
  widgets: ScreenWidgetApi[];
}

export interface DataSource {
  namespace: string;
  serviceId: string;
  resourcePath: string;
  requiredParams: string[];
  schemaPath?: string | null;
}

export interface DataBinding {
  expression: string;
  displayFormat: string | null;
}

export interface FormField {
  key: string;
  label: string;
  fieldType: string;
  order: number;
  required: boolean;
  width?: "Full" | "Half" | "Third";
  placeholder?: string;
  dataBinding?: DataBinding | null;
  isReadOnly?: boolean;
}

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidationRule {
  type: string;
  value: string;
  errorMessage: string;
}

export interface FormFieldConditionalLogic {
  sourceFieldKey: string;
  operator: string;
  value: string;
  action: string;
}

export interface AdminFormField {
  id?: string;
  formTemplateId: string;
  key: string;
  label: string;
  fieldType: number;
  order: number;
  required: boolean;
  width?: number;
  placeholder?: string;
  helpText?: string;
  options?: FormFieldOption[];
  validationRules?: FormFieldValidationRule[];
  conditionalLogic?: FormFieldConditionalLogic | null;
  dataBindingExpression?: string;
  displayFormat?: string;
  isReadOnly?: boolean;
}

export type CreateFormFieldRequest = Omit<AdminFormField, "id">;
export type UpdateFormFieldRequest = Partial<Omit<AdminFormField, "id" | "formTemplateId">>;

export interface FormSchema {
  fields: FormField[];
}

export interface ScreenLayout {
  id: string;
  moduleCode: string;
  code: string;
  title: string;
  dataSources: DataSource[];
  tabs: ScreenTabApi[];
}

export interface WidgetCatalogEntry {
  widgetType: string;   // normalized from API's chartType
  label: string;
  description?: string | null;
  icon?: string | null;        // Lucide icon name e.g. "TrendingUp"
  category?: string | null;   // "visualization" | "healthcare" | "filter" | "layout" | "ai"
  defaultW?: number;
  defaultH?: number;
}

export interface SaveScreenWidgetRequest {
  widgetKey: string;
  widgetType: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  configJson: string;
  referenceId?: string | null;
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
  if (
    body !== null &&
    typeof body === "object" &&
    "success" in (body as object)
  ) {
    return (body as { success: boolean; data: T }).data;
  }
  return body as T;
}

function normalizeDataSource(raw: Record<string, unknown>): DataSource {
  return {
    namespace:      (raw.namespace      ?? raw.Namespace      ?? "") as string,
    serviceId:      (raw.serviceId      ?? raw.ServiceId      ?? "") as string,
    resourcePath:   (raw.resourcePath   ?? raw.ResourcePath   ?? "") as string,
    requiredParams: (raw.requiredParams ?? raw.RequiredParams ?? []) as string[],
    schemaPath:     (raw.schemaPath     ?? raw.SchemaPath     ?? null) as string | null,
  };
}

// Normalize a raw widget object — handles both camelCase and PascalCase from .NET
// Backend may send:
//   - configJson / ConfigJson  (string)
//   - config                   (object) — alias for configJson
//   - formSchema               (object, top-level) — expanded FormTemplate schema
// We merge all into a single configJson string so WidgetRenderer can safeJson() it.
function normalizeWidget(raw: Record<string, unknown>): ScreenWidgetApi {
  // Resolve base config object
  const cfgRaw = raw.configJson ?? raw.ConfigJson ?? raw.config ?? raw.Config;
  let base: Record<string, unknown> =
    typeof cfgRaw === "string"
      ? (() => { try { return JSON.parse(cfgRaw) as Record<string, unknown>; } catch { return {}; } })()
      : ((cfgRaw ?? {}) as Record<string, unknown>);

  // Top-level formSchema (auto-generated from FormTemplate) takes precedence over config.formSchema
  const topFormSchema = raw.formSchema ?? raw.FormSchema;
  if (topFormSchema != null) {
    const fs = topFormSchema as Record<string, unknown>;
    base = { ...base, formSchema: fs };
    // Hoist formKey so FormSectionWidget can use it for submit
    if (fs.formKey) base.formKey = fs.formKey;
  }

  const configJson = Object.keys(base).length > 0 ? JSON.stringify(base) : null;

  return {
    widgetKey:   (raw.widgetKey   ?? raw.WidgetKey   ?? "") as string,
    widgetType:  (raw.widgetType  ?? raw.WidgetType  ?? "") as string,
    gridX:       (raw.gridX       ?? raw.GridX       ?? 0)  as number,
    gridY:       (raw.gridY       ?? raw.GridY       ?? 0)  as number,
    gridW:       (raw.gridW       ?? raw.GridW       ?? 6)  as number,
    gridH:       (raw.gridH       ?? raw.GridH       ?? 4)  as number,
    configJson,
    referenceId: (raw.referenceId ?? raw.ReferenceId ?? null) as string | null,
  };
}

// Normalize a raw catalog entry — handles both camelCase and PascalCase.
// API returns chartType; we store it as widgetType for consistency with the designer.
function normalizeCatalogEntry(raw: Record<string, unknown>): WidgetCatalogEntry {
  return {
    widgetType:  (raw.chartType   ?? raw.ChartType  ?? raw.widgetType ?? raw.WidgetType ?? "") as string,
    label:       (raw.label       ?? raw.Label       ?? "") as string,
    description: (raw.description ?? raw.Description ?? null) as string | null,
    icon:        (raw.icon        ?? raw.Icon        ?? null) as string | null,
    category:    (raw.category    ?? raw.Category    ?? null) as string | null,
    defaultW:    (raw.defaultW    ?? raw.DefaultW)    as number | undefined,
    defaultH:    (raw.defaultH    ?? raw.DefaultH)    as number | undefined,
  };
}

export const adminApi = {
  // ── DynamicFormService modules ────────────────────────────────────────────

  listFormsModules: (): Promise<FormsModule[]> =>
    httpClient
      .get<
        { success: boolean; data: FormsModule[] } | FormsModule[]
      >("/forms/modules")
      .then((r) => unwrapForms<FormsModule[]>(r.data)),

  createFormsModule: (body: {
    code: string;
    name: string;
    description?: string;
  }): Promise<FormsModule> =>
    httpClient
      .post<
        { success: boolean; data: FormsModule } | FormsModule
      >("/forms/admin/modules", body)
      .then((r) => unwrapForms<FormsModule>(r.data)),

  listForms: (moduleCode: string): Promise<FormTemplateListItem[]> =>
    httpClient
      .get<
        | { success: boolean; data: FormTemplateListItem[] }
        | FormTemplateListItem[]
      >(`/forms/${moduleCode}`)
      .then((r) => unwrapForms<FormTemplateListItem[]>(r.data)),

  // Admin endpoint — returns all statuses (Draft / Published / Archived)
  listPages: (moduleCode: string): Promise<FormPageListItem[]> =>
    httpClient
      .get<
        { success: boolean; data: FormPageListItem[] } | FormPageListItem[]
      >(`/forms/admin/${moduleCode}/pages`)
      .then((r) => unwrapForms<FormPageListItem[]>(r.data)),

  createForm: (
    moduleCode: string,
    body: {
      key: string;
      name: string;
      submitButtonLabel?: string;
      allowMultipleSubmissions?: boolean;
    },
  ): Promise<FormTemplateListItem> =>
    httpClient
      .post<
        { success: boolean; data: FormTemplateListItem } | FormTemplateListItem
      >(`/forms/admin/modules/${moduleCode}/forms`, body)
      .then((r) => unwrapForms<FormTemplateListItem>(r.data)),

  createPage: (
    moduleCode: string,
    body: { code: string; title: string; description?: string; sortOrder?: number },
  ): Promise<FormPageListItem> =>
    httpClient
      .post<
        { success: boolean; data: FormPageListItem } | FormPageListItem
      >(`/forms/admin/${moduleCode}/pages`, body)
      .then((r) => unwrapForms<FormPageListItem>(r.data)),

  updatePage: (
    moduleCode: string,
    pageCode: string,
    body: { title?: string; description?: string; sortOrder?: number },
  ): Promise<FormPageListItem> =>
    httpClient
      .put<
        { success: boolean; data: FormPageListItem } | FormPageListItem
      >(`/forms/admin/${moduleCode}/pages/${pageCode}`, body)
      .then((r) => unwrapForms<FormPageListItem>(r.data)),

  deletePage: (moduleCode: string, pageCode: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/${moduleCode}/pages/${pageCode}`)
      .then(() => undefined),

  // v3 endpoint: moduleCode + pageCode in URL
  publishFormPage: (moduleCode: string, pageCode: string): Promise<void> =>
    httpClient
      .post(`/forms/admin/${moduleCode}/pages/${pageCode}/publish`)
      .then(() => undefined),

  // Legacy — used by Screen Designer (menus hook); kept for backward compat
  updatePageLayout: (pageId: string, layout: object): Promise<void> =>
    httpClient
      .put(`/forms/admin/pages/${pageId}/layout`, { layout })
      .then(() => undefined),

  publishPage: (pageId: string): Promise<void> =>
    httpClient
      .post(`/forms/admin/pages/${pageId}/publish`)
      .then(() => undefined),

  getPageSchema: (
    moduleCode: string,
    pageCode: string,
  ): Promise<{ rows: unknown[] }> =>
    httpClient
      .get<{
        success?: boolean;
        data?: { rows: unknown[] };
        rows?: unknown[];
      }>(`/forms/pages/${moduleCode}/${pageCode}`)
      .then((r) => {
        const body = r.data;
        if (body && "success" in body && body.data)
          return body.data as { rows: unknown[] };
        return body as { rows: unknown[] };
      }),

  // ── Page tab management ───────────────────────────────────────────────────

  createPageTab: (
    moduleCode: string,
    pageCode: string,
    body: { slug: string; label: string; sortOrder: number; isDefault?: boolean },
  ): Promise<{ id: string; slug: string }> =>
    httpClient
      .post<{ success?: boolean; data?: { id: string; slug: string } } | { id: string; slug: string }>(
        `/forms/admin/${moduleCode}/pages/${pageCode}/tabs`,
        body,
      )
      .then((r) => unwrapForms<{ id: string; slug: string }>(r.data)),

  updatePageTab: (
    moduleCode: string,
    pageCode: string,
    tabId: string,
    body: { label?: string; sortOrder?: number; isDefault?: boolean },
  ): Promise<void> =>
    httpClient
      .put(`/forms/admin/${moduleCode}/pages/${pageCode}/tabs/${tabId}`, body)
      .then(() => undefined),

  deletePageTab: (moduleCode: string, pageCode: string, tabId: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/${moduleCode}/pages/${pageCode}/tabs/${tabId}`)
      .then(() => undefined),

  savePageWidgets: (
    moduleCode: string,
    pageCode: string,
    tabId: string,
    widgets: SaveScreenWidgetRequest[],
  ): Promise<{ saved: number }> =>
    httpClient
      .put<{ saved: number }>(
        `/forms/admin/${moduleCode}/pages/${pageCode}/tabs/${tabId}/widgets`,
        widgets,
      )
      .then((r) => r.data),

  // ── Widget layout modules (canvas designer) ───────────────────────────────

  listModules: (): Promise<AdminModule[]> =>
    httpClient.get<AdminModule[]>("/admin/modules").then((r) => r.data),

  listSchemas: (): Promise<WidgetSchemaEntry[]> =>
    httpClient.get<WidgetSchemaEntry[]>("/admin/schemas").then((r) => r.data),

  listProviders: (): Promise<ProviderInfo[]> =>
    httpClient
      .get<ProviderApiRecord[]>("/admin/providers")
      .then((r) =>
        r.data.map((p) => ({ id: p.providerId, name: p.displayName })),
      ),

  listOperations: (): Promise<OperationEntry[]> =>
    httpClient.get<OperationApiRecord[]>("/admin/operations").then((r) =>
      r.data.map((op) => ({
        pattern: op.operationPattern,
        providerId: op.providerId ?? "",
      })),
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

  updateTab: (
    slug: string,
    tabId: string,
    body: { label?: string; sortOrder?: number },
  ): Promise<void> =>
    httpClient
      .put(`/admin/modules/${slug}/tabs/${tabId}`, body)
      .then(() => undefined),

  deleteTab: (slug: string, tabId: string): Promise<void> =>
    httpClient
      .delete(`/admin/modules/${slug}/tabs/${tabId}`)
      .then(() => undefined),

  // ── Widgets ───────────────────────────────────────────────────────────────

  saveWidgets: (
    slug: string,
    tabId: string,
    widgets: UpsertWidgetRequest[],
  ): Promise<{ saved: number }> =>
    httpClient
      .put<{
        saved: number;
      }>(`/admin/modules/${slug}/tabs/${tabId}/widgets`, widgets)
      .then((r) => r.data),

  // ── Provider CRUD ─────────────────────────────────────────────────────────

  listFullProviders: (): Promise<ProviderApiRecord[]> =>
    httpClient.get<ProviderApiRecord[]>("/admin/providers").then((r) => r.data),

  createProvider: (body: object): Promise<ProviderApiRecord> =>
    httpClient
      .post<ProviderApiRecord>("/admin/providers", body)
      .then((r) => r.data),

  updateProvider: (
    providerId: string,
    body: object,
  ): Promise<ProviderApiRecord> =>
    httpClient
      .put<ProviderApiRecord>(`/admin/providers/${providerId}`, body)
      .then((r) => r.data),

  deleteProvider: (providerId: string): Promise<void> =>
    httpClient.delete(`/admin/providers/${providerId}`).then(() => undefined),

  // ── Operation CRUD ────────────────────────────────────────────────────────

  listFullOperations: (): Promise<OperationApiRecord[]> =>
    httpClient
      .get<OperationApiRecord[]>("/admin/operations")
      .then((r) => r.data),

  createOperation: (body: object): Promise<OperationApiRecord> =>
    httpClient
      .post<OperationApiRecord>("/admin/operations", body)
      .then((r) => r.data),

  updateOperation: (
    pattern: string,
    body: object,
  ): Promise<OperationApiRecord> =>
    httpClient
      .put<OperationApiRecord>(
        `/admin/operations/${encodeURIComponent(pattern)}`,
        body,
      )
      .then((r) => r.data),

  deleteOperation: (pattern: string): Promise<void> =>
    httpClient
      .delete(`/admin/operations/${encodeURIComponent(pattern)}`)
      .then(() => undefined),

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
    httpClient
      .get<AdminScreen[]>(`/admin/menus/${menuId}/screens`)
      .then((r) => r.data),

  createScreen: (menuId: string, body: object): Promise<AdminScreen> =>
    httpClient
      .post<AdminScreen>(`/admin/menus/${menuId}/screens`, body)
      .then((r) => r.data),

  updateScreen: (
    menuId: string,
    screenId: string,
    body: object,
  ): Promise<void> =>
    httpClient
      .put(`/admin/menus/${menuId}/screens/${screenId}`, body)
      .then(() => undefined),

  deleteScreen: (menuId: string, screenId: string): Promise<void> =>
    httpClient
      .delete(`/admin/menus/${menuId}/screens/${screenId}`)
      .then(() => undefined),

  saveScreen: (
    menuId: string,
    screenId: string,
    body: object,
  ): Promise<{ id: string; savedAt: string }> =>
    httpClient
      .put<{
        id: string;
        savedAt: string;
      }>(`/admin/menus/${menuId}/screens/${screenId}/save`, body)
      .then((r) => r.data),

  // ── Widget individual CRUD ────────────────────────────────────────────────

  listWidgets: (menuId: string, screenId: string): Promise<AdminWidgetDef[]> =>
    httpClient
      .get<
        AdminWidgetDef[]
      >(`/admin/menus/${menuId}/screens/${screenId}/widgets`)
      .then((r) => r.data),

  // ── Permission CRUD ───────────────────────────────────────────────────────

  listPerms: (menuId: string): Promise<AdminPermission[]> =>
    httpClient
      .get<AdminPermission[]>(`/admin/menus/${menuId}/permissions`)
      .then((r) => r.data),

  upsertPerm: (menuId: string, body: object): Promise<AdminPermission> =>
    httpClient
      .post<AdminPermission>(`/admin/menus/${menuId}/permissions`, body)
      .then((r) => r.data),

  updatePerm: (menuId: string, permId: string, body: object): Promise<void> =>
    httpClient
      .put(`/admin/menus/${menuId}/permissions/${permId}`, body)
      .then(() => undefined),

  deletePerm: (menuId: string, permId: string): Promise<void> =>
    httpClient
      .delete(`/admin/menus/${menuId}/permissions/${permId}`)
      .then(() => undefined),

  // ── Screen Designer ───────────────────────────────────────────────────────

  listFormScreens: (moduleCode: string): Promise<FormScreen[]> =>
    httpClient
      .get<
        { success?: boolean; data?: FormScreen[] } | FormScreen[]
      >(`/forms/admin/screens/${moduleCode}`)
      .then((r) => unwrapForms<FormScreen[]>(r.data)),

  getScreenLayout: (
    moduleCode: string,
    screenCode: string,
  ): Promise<ScreenLayout> =>
    httpClient
      .get<{ success?: boolean; data?: ScreenLayout } | ScreenLayout>(
        `/forms/screens/${moduleCode}/${screenCode}/layout`,
      )
      .then((r) => {
        const layout = unwrapForms<ScreenLayout>(r.data);
        if (layout?.tabs) {
          layout.tabs = layout.tabs.map((tab) => ({
            ...tab,
            widgets: (tab.widgets ?? []).map((w) =>
              normalizeWidget(w as unknown as Record<string, unknown>),
            ),
          }));
        }
        layout.dataSources = (layout.dataSources ?? []).map((ds) =>
          normalizeDataSource(ds as unknown as Record<string, unknown>),
        );
        return layout;
      }),

  createFormScreen: (body: {
    moduleCode: string;
    code: string;
    title: string;
    description?: string;
    sortOrder?: number;
  }): Promise<FormScreen> =>
    httpClient
      .post<FormScreen>("/forms/admin/screens", body)
      .then((r) => r.data),

  updateFormScreen: (
    moduleCode: string,
    screenCode: string,
    body: Partial<Pick<FormScreen, "title" | "description" | "sortOrder">>,
  ): Promise<void> =>
    httpClient
      .put(`/forms/admin/screens/${moduleCode}/${screenCode}`, body)
      .then(() => undefined),

  deleteFormScreen: (moduleCode: string, screenCode: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/screens/${moduleCode}/${screenCode}`)
      .then(() => undefined),

  publishFormScreen: (moduleCode: string, screenCode: string): Promise<void> =>
    httpClient
      .post(`/forms/admin/screens/${moduleCode}/${screenCode}/publish`)
      .then(() => undefined),

  listWidgetCatalog: (): Promise<WidgetCatalogEntry[]> =>
    httpClient
      .get<
        | { success?: boolean; data?: WidgetCatalogEntry[] }
        | WidgetCatalogEntry[]
      >("/forms/admin/widget-catalog")
      .then((r) => {
        const raw = unwrapForms<WidgetCatalogEntry[]>(r.data);
        return (Array.isArray(raw) ? raw : []).map((item) =>
          normalizeCatalogEntry(item as unknown as Record<string, unknown>),
        );
      }),

  createScreenTab: (
    moduleCode: string,
    screenCode: string,
    body: {
      slug: string;
      label: string;
      sortOrder: number;
      isDefault?: boolean;
    },
  ): Promise<{ id: string; slug: string }> =>
    httpClient
      .post<
        | { success?: boolean; data?: { id: string; slug: string } }
        | { id: string; slug: string }
      >(`/forms/admin/screens/${moduleCode}/${screenCode}/tabs`, body)
      .then((r) => unwrapForms<{ id: string; slug: string }>(r.data)),

  updateScreenTab: (
    moduleCode: string,
    screenCode: string,
    tabId: string,
    body: { label?: string; sortOrder?: number; isDefault?: boolean },
  ): Promise<void> =>
    httpClient
      .put(
        `/forms/admin/screens/${moduleCode}/${screenCode}/tabs/${tabId}`,
        body,
      )
      .then(() => undefined),

  deleteScreenTab: (
    moduleCode: string,
    screenCode: string,
    tabId: string,
  ): Promise<void> =>
    httpClient
      .delete(`/forms/admin/screens/${moduleCode}/${screenCode}/tabs/${tabId}`)
      .then(() => undefined),

  saveDataSources: (
    moduleCode: string,
    screenCode: string,
    sources: DataSource[],
  ): Promise<void> =>
    httpClient
      .put(
        `/forms/admin/screens/${moduleCode}/${screenCode}/data-sources`,
        sources,
      )
      .then(() => undefined),

  saveScreenWidgets: (
    moduleCode: string,
    screenCode: string,
    tabId: string,
    widgets: SaveScreenWidgetRequest[],
  ): Promise<{ saved: number }> =>
    httpClient
      .put<
        | { success?: boolean; data?: { saved: number } }
        | { saved: number }
      >(
        `/forms/admin/screens/${moduleCode}/${screenCode}/tabs/${tabId}/widgets`,
        widgets.map((w) => ({
          WidgetKey:   w.widgetKey,
          WidgetType:  w.widgetType,
          GridX:       w.gridX,
          GridY:       w.gridY,
          GridW:       w.gridW,
          GridH:       w.gridH,
          ConfigJson:  w.configJson,
          ReferenceId: w.referenceId ?? null,
        })),
      )
      .then((r) => unwrapForms<{ saved: number }>(r.data)),

  // ── Form Template field management ───────────────────────────────────────

  listFormFields: (formTemplateId: string): Promise<AdminFormField[]> =>
    httpClient
      .get<{ success?: boolean; data?: AdminFormField[] } | AdminFormField[]>(
        `/forms/admin/forms/${formTemplateId}/fields`,
      )
      .then((r) => unwrapForms<AdminFormField[]>(r.data)),

  createFormField: (
    formTemplateId: string,
    body: CreateFormFieldRequest,
  ): Promise<AdminFormField> =>
    httpClient
      .post<{ success?: boolean; data?: AdminFormField } | AdminFormField>(
        `/forms/admin/forms/${formTemplateId}/fields`,
        body,
      )
      .then((r) => unwrapForms<AdminFormField>(r.data)),

  updateFormField: (
    formTemplateId: string,
    fieldId: string,
    body: UpdateFormFieldRequest,
  ): Promise<AdminFormField> =>
    httpClient
      .put<{ success?: boolean; data?: AdminFormField } | AdminFormField>(
        `/forms/admin/forms/${formTemplateId}/fields/${fieldId}`,
        body,
      )
      .then((r) => unwrapForms<AdminFormField>(r.data)),

  deleteFormField: (formTemplateId: string, fieldId: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/forms/${formTemplateId}/fields/${fieldId}`)
      .then(() => undefined),

  reorderFormFields: (
    formTemplateId: string,
    fieldOrders: { fieldId: string; order: number }[],
  ): Promise<void> =>
    httpClient
      .put(`/forms/admin/forms/${formTemplateId}/fields/reorder`, fieldOrders)
      .then(() => undefined),

  generateFromSource: (body: {
    moduleCode: string;
    moduleName: string;
    screenCode: string;
    screenTitle: string;
    formKey: string;
    formTitle: string;
    dataSource: DataSource;
    fields: Array<{
      canonicalKey: string | null;
      fieldKey?: string;
      label: string;
      fieldType: string;
      displayFormat?: string | null;
      isReadOnly?: boolean;
      required?: boolean;
      options?: string[];
    }>;
  }): Promise<{
    moduleCode: string;
    screenCode: string;
    formKey: string;
    formTemplateId: string;
    fieldsGenerated: number;
  }> =>
    httpClient
      .post<{ success?: boolean; data?: unknown } | unknown>(
        "/forms/admin/generate-from-source",
        body,
      )
      .then((r) => unwrapForms(r.data) as {
        moduleCode: string;
        screenCode: string;
        formKey: string;
        formTemplateId: string;
        fieldsGenerated: number;
      }),
};
