export interface SignalRConfig {
  hubUrl: string;
  methodName: string;
}

export type SignalRStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

/** Envelope chuẩn server push qua SignalR */
export interface SignalREnvelope<T> {
  type: string;
  payload: T;
  occurredAtUtc: string;
  correlationId: string | null;
}

/** Payload của event "notification" từ NotificationService */
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
