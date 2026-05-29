export type ProviderStatus =
  | 'active'
  | 'suspended'
  | 'maintenance'
  | 'credentials_revoked';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  windowSeconds:    number;
  cooldownSeconds:  number;
}

export interface Provider {
  id:                    string;
  providerId:            string;
  displayName:           string;
  description?:          string;
  clientId:              string;
  operations:            string[];
  timeoutMs:             number;
  priority:              number;        // 1–10, 1 = highest
  status:                ProviderStatus;
  circuitBreaker:        CircuitBreakerConfig;
  maxConcurrentRequests: number;
  createdAt:             string;
  lastConnectedAt?:      string;
}

export interface ProviderForm {
  providerId:              string;
  displayName:             string;
  description:             string;
  clientId:                string;
  clientSecret:            string;  // only filled on create
  operationsText:          string;  // newline-separated patterns
  timeoutMs:               number;
  priority:                number;
  maxConcurrentRequests:   number;
  cbFailureThreshold:      number;
  cbWindowSeconds:         number;
  cbCooldownSeconds:       number;
  status:                  ProviderStatus;
}

export const BLANK_FORM: ProviderForm = {
  providerId: '', displayName: '', description: '', clientId: '', clientSecret: '',
  operationsText: '', timeoutMs: 30000, priority: 5, maxConcurrentRequests: 8,
  cbFailureThreshold: 5, cbWindowSeconds: 60, cbCooldownSeconds: 30, status: 'active',
};

export interface ProbeResult {
  tlsHandshake:    boolean;
  jwtAccepted:     boolean;
  welcomeReceived: boolean;
  latencyMs:       number;
  sessionId:       string | null;
  errorDetail:     string | null;
}

// ─── Operation registry ───────────────────────────────────────────────────────

export type OperationStatus  = 'active' | 'deprecated' | 'disabled';
export type OperationHandler = 'provider' | 'datasource' | 'widget' | 'admin';

export interface Operation {
  id:              string;
  pattern:         string;
  handler:         OperationHandler;
  providerId:      string;
  timeoutMs:       number;
  cacheSeconds:    number | null;
  idempotent:      boolean;
  resultChartType: string | null;
  status:          OperationStatus;
}

export interface OperationForm {
  pattern:         string;
  handler:         OperationHandler;
  providerId:      string;
  timeoutMs:       number;
  cacheSeconds:    number | null;
  idempotent:      boolean;
  resultChartType: string | null;
  status:          OperationStatus;
}

export const BLANK_OPERATION_FORM: OperationForm = {
  pattern: '', handler: 'provider', providerId: '', timeoutMs: 30000,
  cacheSeconds: null, idempotent: true, resultChartType: null, status: 'active',
};
