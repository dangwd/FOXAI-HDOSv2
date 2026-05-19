"use client";

import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { SignalRConfig, SignalRStatus } from "./types";

interface UseSignalRResult<T> {
  data: T | null;
  status: SignalRStatus;
}

export function useSignalR<T>(config?: SignalRConfig): UseSignalRResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<SignalRStatus>(config ? "connecting" : "disconnected");
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const hubUrl = config?.hubUrl;
  const methodName = config?.methodName;

  useEffect(() => {
    if (!hubUrl || !methodName) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    connection.on(methodName, (payload: T) => setData(payload));
    connection.onreconnecting(() => setStatus("reconnecting"));
    connection.onreconnected(() => setStatus("connected"));
    connection.onclose(() => setStatus("disconnected"));

    connection
      .start()
      .then(() => setStatus("connected"))
      .catch(() => setStatus("disconnected"));

    return () => {
      connection.stop();
    };
  }, [hubUrl, methodName]);

  return { data, status };
}
