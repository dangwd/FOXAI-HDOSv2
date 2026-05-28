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
  provider: { label: 'provider', color: '#1677ff', bg: 'rgba(22,119,255,.1)'  },
  cache:    { label: 'cache',    color: '#0ca678', bg: 'rgba(12,166,120,.1)'  },
  local:    { label: 'local',    color: '#8b949e', bg: 'rgba(139,148,158,.1)' },
};

export const MOCK_OPERATIONS: Operation[] = [
  { id: 'op-1',  pattern: 'report.channel.comparison',    handler: 'provider', providerId: 'excel-provider', timeoutMs: 60000, cacheSeconds: 300,  status: 'active' },
  { id: 'op-2',  pattern: 'report.dashboard.summary',     handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 60,   status: 'active' },
  { id: 'op-3',  pattern: 'report.demo.bed.status',       handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null,  status: 'active' },
  { id: 'op-4',  pattern: 'report.demo.flow.steps',       handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null,  status: 'active' },
  { id: 'op-5',  pattern: 'report.demo.map.pins',         handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null,  status: 'active' },
  { id: 'op-6',  pattern: 'report.demo.news2',            handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null,  status: 'active' },
  { id: 'op-7',  pattern: 'report.demo.patient.flow',     handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null,  status: 'active' },
  { id: 'op-8',  pattern: 'report.demo.risk.tiers',       handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null,  status: 'active' },
  { id: 'op-9',  pattern: 'report.demo.room.status',      handler: 'provider', providerId: 'excel-provider', timeoutMs: 10000, cacheSeconds: null,  status: 'active' },
  { id: 'op-10', pattern: 'report.inventory.status',      handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 120,  status: 'active' },
  { id: 'op-11', pattern: 'report.product.detail',        handler: 'provider', providerId: 'excel-provider', timeoutMs: 60000, cacheSeconds: 300,  status: 'active' },
  { id: 'op-12', pattern: 'report.regional.performance',  handler: 'provider', providerId: 'excel-provider', timeoutMs: 30000, cacheSeconds: 60,   status: 'active' },
  { id: 'op-13', pattern: 'report.sales.alerts',          handler: 'provider', providerId: 'excel-provider', timeoutMs: 15000, cacheSeconds: null,  status: 'active' },
  { id: 'op-14', pattern: 'ml.fraud.score',               handler: 'provider', providerId: 'ml-fraud-score', timeoutMs: 45000, cacheSeconds: null,  status: 'active' },
  { id: 'op-15', pattern: 'ml.risk.assess',               handler: 'provider', providerId: 'ml-fraud-score', timeoutMs: 45000, cacheSeconds: null,  status: 'active' },
  { id: 'op-16', pattern: 'erp.patient.lookup',           handler: 'provider', providerId: 'erp-connector',  timeoutMs: 60000, cacheSeconds: 30,   status: 'inactive' },
  { id: 'op-17', pattern: 'erp.billing.summary',          handler: 'provider', providerId: 'erp-connector',  timeoutMs: 60000, cacheSeconds: null,  status: 'inactive' },
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
