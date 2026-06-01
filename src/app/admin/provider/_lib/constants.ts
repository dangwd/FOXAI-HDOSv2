import type { Provider, ProviderStatus, Operation } from './types';

export const STATUS_META: Record<ProviderStatus, { label: string; color: string; bg: string }> = {
  active:              { label: 'Active',      color: '#0ca678', bg: 'rgba(12,166,120,.12)'  },
  suspended:           { label: 'Suspended',   color: '#fa8c16', bg: 'rgba(250,140,22,.12)'  },
  maintenance:         { label: 'Maintenance', color: '#1677ff', bg: 'rgba(22,119,255,.12)'  },
  credentials_revoked: { label: 'Revoked',     color: '#ff4d4f', bg: 'rgba(255,77,79,.12)'   },
};

export const STATUS_ORDER: ProviderStatus[] = [
  'active', 'suspended', 'maintenance', 'credentials_revoked',
];

export function priorityMeta(p: number): { label: string; color: string; bg: string } {
  if (p <= 3) return { label: `P${p} · Cao`,   color: '#ff4d4f', bg: 'rgba(255,77,79,.12)'   };
  if (p <= 6) return { label: `P${p} · TB`,    color: '#fa8c16', bg: 'rgba(250,140,22,.12)'  };
  return              { label: `P${p} · Thấp`, color: '#8b949e', bg: 'rgba(139,148,158,.12)' };
}

const ICON_COLORS = ['#1677ff','#0ca678','#722ed1','#fa8c16','#13c2c2','#eb2f96'];
export function providerColor(id: string): string {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ICON_COLORS[h % ICON_COLORS.length];
}

export const OPERATION_HANDLER_META: Record<string, { label: string; color: string; bg: string }> = {
  provider:   { label: 'provider',   color: '#1677ff', bg: 'rgba(22,119,255,.1)'  },
  datasource: { label: 'datasource', color: '#0ca678', bg: 'rgba(12,166,120,.1)'  },
  widget:     { label: 'widget',     color: '#722ed1', bg: 'rgba(114,46,209,.1)'  },
  admin:      { label: 'admin',      color: '#8b949e', bg: 'rgba(139,148,158,.1)' },
};

export const OPERATION_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:     { label: 'active',     color: '#0ca678', bg: 'rgba(12,166,120,.12)'  },
  deprecated: { label: 'deprecated', color: '#fa8c16', bg: 'rgba(250,140,22,.12)'  },
  disabled:   { label: 'disabled',   color: '#8b949e', bg: 'rgba(139,148,158,.12)' },
};

export const RESULT_CHART_TYPES: { value: string; label: string }[] = [
  { value: 'kpi_grid',            label: 'KpiGrid' },
  { value: 'line_chart',          label: 'LineChart' },
  { value: 'bar_chart',           label: 'BarChart' },
  { value: 'gauge',               label: 'Gauge' },
  { value: 'heatmap',             label: 'Heatmap' },
  { value: 'scatter',             label: 'Scatter' },
  { value: 'funnel',              label: 'Funnel' },
  { value: 'timeline_vertical',   label: 'Timeline' },
  { value: 'alert_list',          label: 'AlertList' },
  { value: 'pivot_table',         label: 'Table (pivot)' },
  { value: 'patient_flow_stages', label: 'PatientFlowStages' },
  { value: 'bed_grid',            label: 'BedGrid' },
  { value: 'room_status_grid',    label: 'RoomStatusGrid' },
  { value: 'risk_tiers',          label: 'RiskTiers' },
  { value: 'flow_steps',          label: 'FlowSteps' },
  { value: 'news2_bars',          label: 'News2Bars' },
  { value: 'map_pins',            label: 'MapPins' },
];

export const MOCK_OPERATIONS: Operation[] = [
  // ── Excel Provider — Business ──────────────────────────────────────────────
  { id: 'op-01', pattern: 'report.dashboard.summary',    handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 60,   idempotent: true,  resultChartType: 'kpi_grid',          status: 'active' },
  { id: 'op-02', pattern: 'report.sales.trend',          handler: 'provider', providerId: 'excel-provider', timeoutMs: 60000, cacheSeconds: 300,  idempotent: true,  resultChartType: 'line_chart',        status: 'active' },
  { id: 'op-03', pattern: 'report.inventory.status',     handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 120,  idempotent: true,  resultChartType: 'bar_chart',         status: 'active' },
  { id: 'op-04', pattern: 'report.regional.performance', handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 60,   idempotent: true,  resultChartType: 'bar_chart',         status: 'active' },
  { id: 'op-05', pattern: 'report.channel.comparison',   handler: 'provider', providerId: 'excel-provider', timeoutMs: 60000, cacheSeconds: 300,  idempotent: true,  resultChartType: null,                status: 'active' },
  { id: 'op-06', pattern: 'report.product.detail',       handler: 'provider', providerId: 'excel-provider', timeoutMs: 60000, cacheSeconds: 300,  idempotent: true,  resultChartType: 'pivot_table',       status: 'active' },
  { id: 'op-07', pattern: 'report.top.performers',       handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 120,  idempotent: true,  resultChartType: 'pivot_table',       status: 'active' },
  { id: 'op-08', pattern: 'report.sales.gauge',          handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 60,   idempotent: true,  resultChartType: 'gauge',             status: 'active' },
  { id: 'op-09', pattern: 'report.sales.heatmap',        handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 120,  idempotent: true,  resultChartType: 'heatmap',           status: 'active' },
  { id: 'op-10', pattern: 'report.sales.scatter',        handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 120,  idempotent: true,  resultChartType: 'scatter',           status: 'active' },
  { id: 'op-11', pattern: 'report.sales.funnel',         handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 120,  idempotent: true,  resultChartType: 'funnel',            status: 'active' },
  { id: 'op-12', pattern: 'report.sales.timeline',       handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 60,   idempotent: true,  resultChartType: 'timeline_vertical', status: 'active' },
  { id: 'op-13', pattern: 'report.sales.alerts',         handler: 'provider', providerId: 'excel-provider', timeoutMs: 15000, cacheSeconds: null, idempotent: false, resultChartType: 'alert_list',        status: 'active' },
  { id: 'op-14', pattern: 'report.sales.pivot',          handler: 'provider', providerId: 'excel-provider', timeoutMs: 60000, cacheSeconds: 300,  idempotent: true,  resultChartType: 'pivot_table',       status: 'active' },
  // ── Excel Provider — Healthcare Demo ──────────────────────────────────────
  { id: 'op-15', pattern: 'report.demo.patient.flow',    handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null, idempotent: false, resultChartType: 'patient_flow_stages', status: 'active' },
  { id: 'op-16', pattern: 'report.demo.bed.status',      handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null, idempotent: false, resultChartType: 'bed_grid',          status: 'active' },
  { id: 'op-17', pattern: 'report.demo.room.status',     handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null, idempotent: false, resultChartType: 'room_status_grid',  status: 'active' },
  { id: 'op-18', pattern: 'report.demo.risk.tiers',      handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null, idempotent: false, resultChartType: 'risk_tiers',        status: 'active' },
  { id: 'op-19', pattern: 'report.demo.flow.steps',      handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null, idempotent: false, resultChartType: 'flow_steps',        status: 'active' },
  { id: 'op-20', pattern: 'report.demo.news2',           handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null, idempotent: false, resultChartType: 'news2_bars',        status: 'active' },
  { id: 'op-21', pattern: 'report.demo.map.pins',        handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null, idempotent: false, resultChartType: 'map_pins',          status: 'active' },
  // ── ML Provider ───────────────────────────────────────────────────────────
  { id: 'op-22', pattern: 'ml.fraud.score',              handler: 'provider', providerId: 'ml-fraud-score', timeoutMs: 45000, cacheSeconds: null, idempotent: true,  resultChartType: null,                status: 'active' },
  { id: 'op-23', pattern: 'ml.risk.assess',              handler: 'provider', providerId: 'ml-fraud-score', timeoutMs: 45000, cacheSeconds: null, idempotent: true,  resultChartType: null,                status: 'active' },
  // ── ERP Connector ─────────────────────────────────────────────────────────
  { id: 'op-24', pattern: 'erp.patient.lookup',          handler: 'provider', providerId: 'erp-connector',  timeoutMs: 60000, cacheSeconds: 30,   idempotent: true,  resultChartType: null,                status: 'deprecated' },
  { id: 'op-25', pattern: 'erp.billing.summary',         handler: 'provider', providerId: 'erp-connector',  timeoutMs: 60000, cacheSeconds: null, idempotent: true,  resultChartType: null,                status: 'disabled' },
];

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: '1', providerId: 'excel-provider', displayName: 'Excel Data Provider',
    description: 'Đọc dữ liệu từ file Excel (.xlsx) và phục vụ các report dashboard',
    clientId: 'excel-provider',
    operations: ['report.dashboard.summary','report.sales.trend','report.inventory.status','report.regional.performance','report.channel.comparison','report.product.detail','report.top.performers'],
    timeoutMs: 30000, priority: 3, status: 'active',
    circuitBreaker: { failureThreshold: 5, windowSeconds: 60, cooldownSeconds: 30 },
    maxConcurrentRequests: 8, createdAt: '2026-01-15T08:00:00Z', lastConnectedAt: '2026-05-28T13:00:00Z',
  },
  {
    id: '2', providerId: 'ml-fraud-score', displayName: 'ML Fraud Scoring',
    description: 'Real-time fraud detection — phân loại giao dịch theo mức độ rủi ro bằng ML',
    clientId: 'ml-fraud-score', operations: ['ml.fraud.score','ml.risk.assess'],
    timeoutMs: 45000, priority: 2, status: 'active',
    circuitBreaker: { failureThreshold: 3, windowSeconds: 30, cooldownSeconds: 60 },
    maxConcurrentRequests: 16, createdAt: '2026-02-10T09:00:00Z', lastConnectedAt: '2026-05-28T12:45:00Z',
  },
  {
    id: '3', providerId: 'erp-connector', displayName: 'ERP System Connector',
    description: 'Kết nối và đồng bộ dữ liệu từ hệ thống ERP nội bộ (SAP / Oracle)',
    clientId: 'erp-connector',
    operations: ['erp.patient.lookup','erp.billing.summary','erp.inventory.query','erp.hr.headcount','erp.finance.report'],
    timeoutMs: 60000, priority: 4, status: 'maintenance',
    circuitBreaker: { failureThreshold: 5, windowSeconds: 60, cooldownSeconds: 30 },
    maxConcurrentRequests: 4, createdAt: '2026-03-01T10:00:00Z', lastConnectedAt: '2026-05-25T08:00:00Z',
  },
  {
    id: '4', providerId: 'bi-engine', displayName: 'BI Analytics Engine',
    description: 'Business intelligence và phân tích nâng cao, aggregation và forecast phức tạp',
    clientId: 'bi-engine', operations: ['bi.cohort.analysis','bi.funnel.report','bi.trend.forecast'],
    timeoutMs: 120000, priority: 6, status: 'suspended',
    circuitBreaker: { failureThreshold: 5, windowSeconds: 60, cooldownSeconds: 30 },
    maxConcurrentRequests: 4, createdAt: '2026-04-01T11:00:00Z',
  },
];
