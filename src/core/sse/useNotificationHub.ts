"use client";

import { useEffect, useRef } from "react";
import { notification } from "antd";
import useAuthStore from "@/core/auth/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { SSEEnvelope, NotificationPayload } from "./types";

const SSE_URL = process.env.NEXT_PUBLIC_SSE_URL ?? "/notifications/sse";

export function useNotificationHub() {
  const [api, contextHolder] = notification.useNotification();
  const token = useAuthStore((s) => s.accessToken);
  const push = useNotificationStore((s) => s.push);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) return;

    const url = `${SSE_URL}?access_token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("notification", (e: MessageEvent) => {
      const envelope = JSON.parse(e.data) as SSEEnvelope<NotificationPayload>;
      push(envelope.payload);
      api.info({
        title: envelope.payload.subject,
        description: envelope.payload.body,
        placement: "topRight",
        duration: 6,
      });
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        console.warn("[NotificationSSE] connection closed — will not retry");
      }
      // readyState === CONNECTING means browser is auto-retrying; no log needed
    };

    return () => {
      es.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return contextHolder;
}
