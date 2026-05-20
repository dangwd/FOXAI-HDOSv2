"use client";

import { useEffect, useRef, useState } from "react";
import useAuthStore from "@/core/auth/authStore";
import type { SSEConfig, SSEStatus } from "./types";

interface UseSSEResult<T> {
  data: T | null;
  status: SSEStatus;
}

export function useSSE<T>(config?: SSEConfig): UseSSEResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<SSEStatus>(config ? "connecting" : "disconnected");
  const token = useAuthStore((s) => s.accessToken);
  const esRef = useRef<EventSource | null>(null);

  const url = config?.url;
  const event = config?.event;

  useEffect(() => {
    if (!url || !event || !token) return;

    const fullUrl = `${url}?access_token=${encodeURIComponent(token)}`;
    setStatus("connecting");

    const es = new EventSource(fullUrl);
    esRef.current = es;

    es.onopen = () => setStatus("connected");

    es.addEventListener(event, (e: MessageEvent) => {
      try {
        setData(JSON.parse(e.data) as T);
      } catch { /* ignore malformed frames */ }
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setStatus("disconnected");
      } else {
        // readyState === CONNECTING → browser is auto-retrying
        setStatus("reconnecting");
      }
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [url, event, token]);

  return { data, status };
}
