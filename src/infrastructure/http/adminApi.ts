import axios from 'axios';
import httpClient from './httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WidgetCategory = 'visualization' | 'healthcare' | 'filter' | 'layout' | 'ai';

export type ModuleGroup = 'dieu-hanh' | 'lam-sang' | 'quan-tri';

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

// ─── API functions ────────────────────────────────────────────────────────────

export const adminApi = {
  listModules: (): Promise<AdminModule[]> =>
    httpClient.get<AdminModule[]>('/api/v1/admin/modules').then((r) => r.data),

  listSchemas: (): Promise<WidgetSchemaEntry[]> =>
    httpClient.get<WidgetSchemaEntry[]>('/api/v1/admin/schemas').then((r) => r.data),

  listProviders: (): Promise<ProviderInfo[]> =>
    httpClient.get<ProviderInfo[]>('/api/v1/admin/providers').then((r) => r.data),

  listOperations: (): Promise<OperationEntry[]> =>
    httpClient.get<OperationEntry[]>('/api/v1/admin/operations').then((r) => r.data),

  getModuleLayout: (slug: string): Promise<ModuleLayout> =>
    axios.get<ModuleLayout>(`/api/v1/modules/${slug}/layout`).then((r) => r.data),

  createTab: (
    slug: string,
    body: { slug: string; label: string; sortOrder: number },
  ): Promise<{ id: string; slug: string }> =>
    httpClient
      .post<{ id: string; slug: string }>(`/api/v1/admin/modules/${slug}/tabs`, body)
      .then((r) => r.data),

  updateTab: (
    slug: string,
    tabId: string,
    body: { label?: string; sortOrder?: number },
  ): Promise<void> =>
    httpClient
      .put(`/api/v1/admin/modules/${slug}/tabs/${tabId}`, body)
      .then(() => undefined),

  deleteTab: (slug: string, tabId: string): Promise<void> =>
    httpClient
      .delete(`/api/v1/admin/modules/${slug}/tabs/${tabId}`)
      .then(() => undefined),

  saveWidgets: (
    slug: string,
    tabId: string,
    widgets: UpsertWidgetRequest[],
  ): Promise<{ saved: number }> =>
    httpClient
      .put<{ saved: number }>(
        `/api/v1/admin/modules/${slug}/tabs/${tabId}/widgets`,
        widgets,
      )
      .then((r) => r.data),
};
