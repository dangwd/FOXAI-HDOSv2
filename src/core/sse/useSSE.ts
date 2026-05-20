"use client";

import { useEffect, useReducer, useState } from "react";
import useAuthStore from "@/core/auth/authStore";
import { poolSubscribe } from "./ssePool";
import type { SSEConfig, SSEStatus } from "./types";

interface UseSSEResult<T> {
  data: T | null;
  status: SSEStatus;
}

export function useSSE<T>(config?: SSEConfig): UseSSEResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, dispatchStatus] = useReducer(
    (_: SSEStatus, next: SSEStatus) => next,
    config ? "connecting" : "disconnected",
  );
  const token = useAuthStore((s) => s.accessToken);

  const url   = config?.url;
  const event = config?.event;

  useEffect(() => {
    if (!url || !event || !token) return;

    const fullUrl = `${url}?access_token=${encodeURIComponent(token)}`;

    const unsub = poolSubscribe(
      fullUrl,
      event,
      (raw) => setData(raw as T),
      dispatchStatus,
    );

    return unsub;
  }, [url, event, token]);

  return { data, status };
}
