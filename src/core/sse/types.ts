export interface SSEConfig {
  url: string;
  event: string;
}

export type SSEStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export interface SSEEnvelope<T> {
  type: string;
  payload: T;
  occurredAtUtc: string;
  correlationId: string | null;
}

export interface NotificationPayload {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  channel: string;
  status: string;
  createdAtUtc: string;
  sentAtUtc: string | null;
}
