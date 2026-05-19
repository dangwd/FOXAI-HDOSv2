export interface SignalRConfig {
  hubUrl: string;
  methodName: string;
}

export type SignalRStatus = "connecting" | "connected" | "reconnecting" | "disconnected";
