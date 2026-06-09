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
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  live?: boolean;
  actions?: import("@/types/screen").ScreenAction[];
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
  id:           string;
  code:         string;
  title:        string;
  description?: string;
  status:       "Draft" | "Published" | "Archived";
  sortOrder:    number;
  tabCount?:    number;
  createdAtUtc?: string;
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
  namespace:      string;
  operationId?:   string | null;   // managed mode: "providerCode::operationKey"
  serviceId?:     string | null;   // legacy mode
  resourcePath?:  string | null;   // legacy mode
  requiredParams: string[];
  schemaPath?:    string | null;
  // resolved fields returned by layout endpoint (read-only):
  baseUrl?:       string | null;
  kind?:          "Single" | "List" | null;
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

// ─── DynamicFormService Provider Catalog types (doc 41) ─────────────────────

export type FormsProviderStatus   = "Active" | "Inactive";
export type FormsOperationKind    = "Single" | "List";
export type FormsOperationStatus  = "Active" | "Inactive";

export interface FormsProviderDto {
  id:             string;
  code:           string;
  displayName:    string;
  baseUrl:        string;
  status:         FormsProviderStatus;
  operationCount: number;
  createdAtUtc:   string;
  updatedAtUtc?:  string | null;
}

export interface FormsOperationDto {
  id:              string;
  providerCode:    string;
  operationKey:    string;
  displayName:     string;
  pattern:         string;
  schemaPath?:     string | null;
  requiredParams:  string[];
  kind:            FormsOperationKind;
  status:          FormsOperationStatus;
  combinedRef:     string;   // "providerCode::operationKey"
  createdAtUtc:    string;
  updatedAtUtc?:   string | null;
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

// ─── LakehouseService types (doc 44) ────────────────────────────────────────

/**
 * ViewBinding — đăng ký PostgreSQL view ↔ SourceProfile trong DataMatchingService.
 * Admin tạo binding → WarehousePollerWorker tự poll và publish RawRecordIngestRequestedIntegrationEvent.
 */
export interface ViewBinding {
  id:                  string;
  viewName:            string;   // "warehouse.v_lab_results_v1"
  sourceSystem:        string;   // "lakehouse:v_lab_results_v1" — phải khớp SourceProfile
  recordType:          string;   // "lab-result" — phải khớp SourceProfile
  businessKeyColumn:   string;   // tên cột trong PG view dùng làm business key
  updatedAtColumn:     string;   // tên cột updated_at để incremental poll
  pollIntervalSeconds: number;   // 300 = 5 phút
  isActive:            boolean;
  createdAtUtc:        string;
  updatedAtUtc?:       string | null;
}

export type CreateViewBindingRequest = Omit<ViewBinding, "id" | "isActive" | "createdAtUtc" | "updatedAtUtc">;
export type UpdateViewBindingRequest = Partial<Pick<ViewBinding, "businessKeyColumn" | "updatedAtColumn" | "pollIntervalSeconds" | "isActive">>;

/** Payload cho POST /lakehouse/view-bindings/with-auto-profile (MVP B) */
export interface CreateWithAutoProfileRequest {
  viewName:            string;
  sourceSystem:        string;
  recordType:          string;
  businessKeyColumn:   string;
  updatedAtColumn?:    string | null;
  pollIntervalSeconds: number;
  displayName:         string;
}

/** Response của with-auto-profile — binding đã tạo + SourceProfile auto-sinh */
export interface ViewBindingAutoProfileResult {
  binding:          ViewBinding;
  profileEnrolled:  boolean;
  businessKeyField: string;
  mappings:         Record<string, string>;
}

// ─── DataMatchingService types ───────────────────────────────────────────────

export interface DmSourceProfile {
  id:               string;
  sourceSystem:     string;
  recordType:       string;
  displayName:      string;
  businessKeyField: string;
  mappings:         Record<string, string>;
}

export interface DmIngestJsonRequest {
  sourceSystem:        string;
  recordType:          string;
  payload:             Record<string, unknown>;
  businessKeyOverride?: string | null;
}

export interface DmIngestResult {
  id:           string;
  sourceSystem: string;
  recordType:   string;
  businessKey:  string;
  status:       string;
}

export interface DmIngestBatchResult {
  count: number;
  ids:   string[];
}

export interface DmRecordDto {
  id:               string;
  sourceSystem:     string;
  recordType:       string;
  businessKey:      string;
  status:           string;
  canonicalPayload: string;
  receivedAt:       string;
  processedAt:      string | null;
}

export interface DmRecordsQuery {
  sourceSystem?: string;
  recordType?:   string;
  field?:        string;
  value?:        string;
  from?:         string;
  to?:           string;
  limit?:        number;
}

export interface DmReportColumn {
  key:   string;
  label: string;
  type:  string;
}

export interface DmReportRow {
  data: Record<string, unknown>;
}

export interface DmReportDto {
  reportCode:   string;
  reportName:   string;
  generatedAt:  string;
  columns:      DmReportColumn[];
  rows:         DmReportRow[];
  summary:      Record<string, unknown>;
}

export interface DmReportQuery {
  sourceSystem?: string;
  recordType?:   string;
  from?:         string;
  to?:           string;
}

// ─── LakehouseService — DataContract Engine types (doc 53/56) ────────────────

/** Metadata cho 1 DataContract đã đăng ký trong LakehouseService */
export interface DataContractMeta {
  code:           string;   // "finance.daily.row"
  displayName:    string;
  schemaTypeName: string;   // "FinanceDailyRow"
}

/** Query params chung cho DataContract endpoints */
export interface DataContractQueryParams {
  source?:     string;   // "demo" | "sql" | "staging" | ...
  date?:       string;   // "yyyy-MM-dd"
  department?: number;
  limit?:      number;
  [key: string]: string | number | undefined;
}

/** 1 row kết quả form pre-fill — dict dạng field → value */
export type FormPrefillRow = Record<string, unknown>;

/** Response shape của /lakehouse/contracts/{code}/prefill */
export interface FormPrefillResult {
  contractCode: string;
  rowCount:     number;
  rows:         FormPrefillRow[];
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
    operationId:    (raw.operationId    ?? raw.OperationId    ?? null) as string | null,
    serviceId:      (raw.serviceId      ?? raw.ServiceId      ?? null) as string | null,
    resourcePath:   (raw.resourcePath   ?? raw.ResourcePath   ?? null) as string | null,
    requiredParams: (raw.requiredParams ?? raw.RequiredParams ?? []) as string[],
    schemaPath:     (raw.schemaPath     ?? raw.SchemaPath     ?? null) as string | null,
    baseUrl:        (raw.baseUrl        ?? raw.BaseUrl        ?? null) as string | null,
    kind:           (raw.kind           ?? raw.Kind           ?? null) as "Single" | "List" | null,
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

  updateFormsModule: (
    moduleCode: string,
    body: { name: string; description?: string },
  ): Promise<FormsModule> =>
    httpClient
      .put<{ success?: boolean; data?: FormsModule } | FormsModule>(
        `/forms/admin/modules/${moduleCode}`,
        body,
      )
      .then((r) => unwrapForms<FormsModule>(r.data)),

  deleteFormsModule: (moduleCode: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/modules/${moduleCode}`)
      .then(() => undefined),

  listForms: (moduleCode: string): Promise<FormTemplateListItem[]> =>
    httpClient
      .get<
        | { success: boolean; data: FormTemplateListItem[] }
        | FormTemplateListItem[]
      >(`/forms/${moduleCode}`)
      .then((r) => unwrapForms<FormTemplateListItem[]>(r.data)),

  // Admin endpoint — returns all statuses (Draft / Published / Archived)
  // Migrated from /forms/admin/{mc}/pages (doc 42)
  listPages: (moduleCode: string): Promise<FormPageListItem[]> =>
    httpClient
      .get<
        { success: boolean; data: FormPageListItem[] } | FormPageListItem[]
      >(`/forms/admin/screens/${moduleCode}`)
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

  // Migrated from /forms/admin/{mc}/pages (doc 42)
  createPage: (
    moduleCode: string,
    body: { code: string; title: string; description?: string; sortOrder?: number },
  ): Promise<FormPageListItem> =>
    httpClient
      .post<
        { success: boolean; data: FormPageListItem } | FormPageListItem
      >("/forms/admin/screens", { moduleCode, ...body })
      .then((r) => unwrapForms<FormPageListItem>(r.data)),

  updatePage: (
    moduleCode: string,
    pageCode: string,
    body: { title?: string; description?: string; sortOrder?: number },
  ): Promise<FormPageListItem> =>
    httpClient
      .put<
        { success: boolean; data: FormPageListItem } | FormPageListItem
      >(`/forms/admin/screens/${moduleCode}/${pageCode}`, body)
      .then((r) => unwrapForms<FormPageListItem>(r.data)),

  deletePage: (moduleCode: string, pageCode: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/screens/${moduleCode}/${pageCode}`)
      .then(() => undefined),

  // Migrated from /forms/admin/{mc}/pages/{pc}/publish (doc 42)
  publishFormPage: (moduleCode: string, pageCode: string): Promise<void> =>
    httpClient
      .post(`/forms/admin/screens/${moduleCode}/${pageCode}/publish`)
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

  // ── Page tab management (migrated from /pages/ to /screens/ — doc 42) ────────

  createPageTab: (
    moduleCode: string,
    pageCode: string,
    body: { slug: string; label: string; sortOrder: number; isDefault?: boolean },
  ): Promise<{ id: string; slug: string }> =>
    httpClient
      .post<{ success?: boolean; data?: { id: string; slug: string } } | { id: string; slug: string }>(
        `/forms/admin/screens/${moduleCode}/${pageCode}/tabs`,
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
      .put(`/forms/admin/screens/${moduleCode}/${pageCode}/tabs/${tabId}`, body)
      .then(() => undefined),

  deletePageTab: (moduleCode: string, pageCode: string, tabId: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/screens/${moduleCode}/${pageCode}/tabs/${tabId}`)
      .then(() => undefined),

  savePageWidgets: (
    moduleCode: string,
    pageCode: string,
    tabId: string,
    widgets: SaveScreenWidgetRequest[],
  ): Promise<{ saved: number }> =>
    httpClient
      .put<{ saved: number }>(
        `/forms/admin/screens/${moduleCode}/${pageCode}/tabs/${tabId}/widgets`,
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

  // ── DynamicFormService Provider Catalog (doc 41) ─────────────────────────

  listFormsProviders: (status?: FormsProviderStatus): Promise<FormsProviderDto[]> =>
    httpClient
      .get<{ success?: boolean; data?: FormsProviderDto[] } | FormsProviderDto[]>(
        "/forms/admin/providers",
        { params: status ? { status } : undefined },
      )
      .then((r) => unwrapForms<FormsProviderDto[]>(r.data)),

  createFormsProvider: (body: {
    code: string;
    displayName: string;
    baseUrl: string;
  }): Promise<FormsProviderDto> =>
    httpClient
      .post<{ success?: boolean; data?: FormsProviderDto } | FormsProviderDto>(
        "/forms/admin/providers",
        body,
      )
      .then((r) => unwrapForms<FormsProviderDto>(r.data)),

  updateFormsProvider: (
    providerCode: string,
    body: { displayName: string; baseUrl: string; status?: FormsProviderStatus },
  ): Promise<FormsProviderDto> =>
    httpClient
      .put<{ success?: boolean; data?: FormsProviderDto } | FormsProviderDto>(
        `/forms/admin/providers/${providerCode}`,
        body,
      )
      .then((r) => unwrapForms<FormsProviderDto>(r.data)),

  deleteFormsProvider: (providerCode: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/providers/${providerCode}`)
      .then(() => undefined),

  listFormsOperations: (status?: FormsOperationStatus): Promise<FormsOperationDto[]> =>
    httpClient
      .get<{ success?: boolean; data?: FormsOperationDto[] } | FormsOperationDto[]>(
        "/forms/admin/operations",
        { params: status ? { status } : undefined },
      )
      .then((r) => unwrapForms<FormsOperationDto[]>(r.data)),

  listFormsOperationsByProvider: (
    providerCode: string,
  ): Promise<FormsOperationDto[]> =>
    httpClient
      .get<{ success?: boolean; data?: FormsOperationDto[] } | FormsOperationDto[]>(
        `/forms/admin/providers/${providerCode}/operations`,
      )
      .then((r) => unwrapForms<FormsOperationDto[]>(r.data)),

  createFormsOperation: (
    providerCode: string,
    body: {
      operationKey: string;
      displayName: string;
      pattern: string;
      schemaPath?: string;
      requiredParams: string[];
      kind: FormsOperationKind;
    },
  ): Promise<FormsOperationDto> =>
    httpClient
      .post<{ success?: boolean; data?: FormsOperationDto } | FormsOperationDto>(
        `/forms/admin/providers/${providerCode}/operations`,
        body,
      )
      .then((r) => unwrapForms<FormsOperationDto>(r.data)),

  updateFormsOperation: (
    providerCode: string,
    operationKey: string,
    body: {
      displayName: string;
      pattern: string;
      schemaPath?: string | null;
      requiredParams: string[];
      kind: FormsOperationKind;
      status?: FormsOperationStatus;
    },
  ): Promise<FormsOperationDto> =>
    httpClient
      .put<{ success?: boolean; data?: FormsOperationDto } | FormsOperationDto>(
        `/forms/admin/providers/${providerCode}/operations/${operationKey}`,
        body,
      )
      .then((r) => unwrapForms<FormsOperationDto>(r.data)),

  deleteFormsOperation: (providerCode: string, operationKey: string): Promise<void> =>
    httpClient
      .delete(`/forms/admin/providers/${providerCode}/operations/${operationKey}`)
      .then(() => undefined),

  // ── LakehouseService — ViewBinding CRUD (doc 44) ────────────────────────

  listViewBindings: (): Promise<ViewBinding[]> =>
    httpClient
      .get<{ success?: boolean; data?: ViewBinding[] } | ViewBinding[]>(
        "/lakehouse/view-bindings",
      )
      .then((r) => unwrapForms<ViewBinding[]>(r.data)),

  createViewBinding: (body: CreateViewBindingRequest): Promise<ViewBinding> =>
    httpClient
      .post<{ success?: boolean; data?: ViewBinding } | ViewBinding>(
        "/lakehouse/view-bindings",
        body,
      )
      .then((r) => unwrapForms<ViewBinding>(r.data)),

  updateViewBinding: (id: string, body: UpdateViewBindingRequest): Promise<ViewBinding> =>
    httpClient
      .put<{ success?: boolean; data?: ViewBinding } | ViewBinding>(
        `/lakehouse/view-bindings/${id}`,
        body,
      )
      .then((r) => unwrapForms<ViewBinding>(r.data)),

  deleteViewBinding: (id: string): Promise<void> =>
    httpClient
      .delete(`/lakehouse/view-bindings/${id}`)
      .then(() => undefined),

  // MVP B — tạo ViewBinding + auto-enroll SourceProfile trong 1 call (doc 47)
  createViewBindingWithAutoProfile: (body: CreateWithAutoProfileRequest): Promise<ViewBindingAutoProfileResult> =>
    httpClient
      .post<{ success?: boolean; data?: ViewBindingAutoProfileResult } | ViewBindingAutoProfileResult>(
        "/lakehouse/view-bindings/with-auto-profile",
        body,
      )
      .then((r) => unwrapForms<ViewBindingAutoProfileResult>(r.data)),

  // Trigger 1 lần sync thủ công — không chờ response data
  triggerViewBindingSync: (id: string): Promise<void> =>
    httpClient
      .post(`/lakehouse/view-bindings/${id}/sync`)
      .then(() => undefined),

  // ── DataMatchingService — Source Profiles ────────────────────────────────

  // ── LakehouseService — Path B: Lakehouse Charts (doc 51) ────────────────

  /** List chart code đã đăng ký qua ILakehouseChartConfig */
  listLakehouseCharts: (): Promise<string[]> =>
    httpClient
      .get<{ success: boolean; data: string[] }>("/lakehouse/charts")
      .then((r) => unwrapForms<string[]>(r.data)),

  /** Fetch 1 chart từ raw SQL (Path B) — trả SduiPage shape */
  fetchLakehouseChart: (
    code: string,
    opts?: { date?: string; department?: number; demo?: boolean },
  ): Promise<import("@/types/sdui").SduiPage> =>
    httpClient
      .get<{ success: boolean; data: import("@/types/sdui").SduiPage }>(
        `/lakehouse/charts/${encodeURIComponent(code)}`,
        { params: opts },
      )
      .then((r) => unwrapForms<import("@/types/sdui").SduiPage>(r.data)),

  // ── LakehouseService — DataContract Engine (doc 53) ──────────────────────

  /** List tất cả DataContract đã đăng ký */
  listDataContracts: (): Promise<DataContractMeta[]> =>
    httpClient
      .get<{ success: boolean; data: DataContractMeta[] }>("/lakehouse/contracts")
      .then((r) => unwrapForms<DataContractMeta[]>(r.data)),

  /** Fetch chart output từ DataContract gateway — trả SduiPage shape */
  fetchContractChart: (
    contractCode: string,
    opts?: DataContractQueryParams,
  ): Promise<import("@/types/sdui").SduiPage> =>
    httpClient
      .get<{ success: boolean; data: import("@/types/sdui").SduiPage }>(
        `/lakehouse/contracts/${encodeURIComponent(contractCode)}/chart`,
        { params: opts },
      )
      .then((r) => unwrapForms<import("@/types/sdui").SduiPage>(r.data)),

  /** Fetch form pre-fill rows từ DataContract gateway */
  fetchContractPrefill: (
    contractCode: string,
    opts?: DataContractQueryParams,
  ): Promise<FormPrefillResult> =>
    httpClient
      .get<{ success: boolean; data: FormPrefillResult }>(
        `/lakehouse/contracts/${encodeURIComponent(contractCode)}/prefill`,
        { params: opts },
      )
      .then((r) => unwrapForms<FormPrefillResult>(r.data)),

  // ── DataMatchingService — SDUI Pages (doc 48) ────────────────────────────

  listDmPages: (): Promise<string[]> =>
    httpClient
      .get<{ success: boolean; data: string[] }>("/dm/pages")
      .then((r) => unwrapForms<string[]>(r.data)),

  fetchDmPage: (code: string, opts?: { sourceSystem?: string; date?: string }): Promise<import("@/types/sdui").SduiPage> =>
    httpClient
      .get<{ success: boolean; data: import("@/types/sdui").SduiPage }>(
        `/dm/pages/${encodeURIComponent(code)}`,
        { params: opts },
      )
      .then((r) => unwrapForms<import("@/types/sdui").SduiPage>(r.data)),

  // ── DataMatchingService — Source Profiles ────────────────────────────────

  listSourceProfiles: (sourceSystem?: string): Promise<DmSourceProfile[]> =>
    httpClient
      .get<{ success: boolean; data: DmSourceProfile[] }>(
        "/dm/sources",
        { params: sourceSystem ? { sourceSystem } : undefined },
      )
      .then((r) => unwrapForms<DmSourceProfile[]>(r.data)),

  createSourceProfile: (body: {
    sourceSystem:     string;
    recordType:       string;
    displayName:      string;
    businessKeyField: string;
    mappings:         Record<string, string>;
  }): Promise<DmSourceProfile> =>
    httpClient
      .post<{ success: boolean; data: DmSourceProfile }>("/dm/sources", body)
      .then((r) => unwrapForms<DmSourceProfile>(r.data)),

  updateSourceProfile: (id: string, body: {
    displayName:      string;
    businessKeyField: string;
    mappings:         Record<string, string>;
  }): Promise<DmSourceProfile> =>
    httpClient
      .put<{ success: boolean; data: DmSourceProfile }>(`/dm/sources/${id}`, body)
      .then((r) => unwrapForms<DmSourceProfile>(r.data)),

  deleteSourceProfile: (id: string): Promise<void> =>
    httpClient
      .delete(`/dm/sources/${id}`)
      .then(() => undefined),

  // ── DataMatchingService — Ingest ──────────────────────────────────────────

  ingestJson: (body: DmIngestJsonRequest): Promise<DmIngestResult> =>
    httpClient
      .post<{ success: boolean; data: DmIngestResult }>("/dm/ingest/json", body)
      .then((r) => unwrapForms<DmIngestResult>(r.data)),

  ingestFile: (formData: FormData): Promise<DmIngestBatchResult> =>
    httpClient
      .post<{ success: boolean; data: DmIngestBatchResult }>("/dm/ingest/file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => unwrapForms<DmIngestBatchResult>(r.data)),

  // ── DataMatchingService — Records ─────────────────────────────────────────

  getDmRecords: (params: DmRecordsQuery): Promise<DmRecordDto[]> =>
    httpClient
      .get<{ success: boolean; data: DmRecordDto[] }>("/dm/records", { params })
      .then((r) => unwrapForms<DmRecordDto[]>(r.data)),

  // ── DataMatchingService — Reports ─────────────────────────────────────────

  getDmReport: (reportCode: string, params?: DmReportQuery): Promise<DmReportDto> =>
    httpClient
      .get<{ success: boolean; data: DmReportDto }>(
        `/dm/reports/${encodeURIComponent(reportCode)}`,
        { params },
      )
      .then((r) => unwrapForms<DmReportDto>(r.data)),

  // ── DataMatchingService — Schema Discovery (DynForm integration) ──────────

  getSourceSchema: (
    sourceSystem: string,
    recordType: string,
  ): Promise<{
    namespace:        string;
    businessKeyField: string;
    fields: { key: string; type: string; label: string | null; sourceField: string }[];
  }> =>
    httpClient
      .get<{ success?: boolean; data?: unknown } | unknown>(
        `/dm/sources/${encodeURIComponent(sourceSystem)}/${encodeURIComponent(recordType)}/schema`,
      )
      .then((r) => unwrapForms(r.data) as {
        namespace:        string;
        businessKeyField: string;
        fields: { key: string; type: string; label: string | null; sourceField: string }[];
      }),

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
