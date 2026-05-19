"use client";

import { useEffect, useRef } from "react";
import { notification } from "antd";
import useAuthStore from "@/core/auth/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { SignalREnvelope, NotificationPayload } from "./types";

// Dev: NEXT_PUBLIC_SSE_URL trỏ thẳng tới backend (https://192.168.100.60:8443/notifications/sse)
// Production: relative path → server-https.js proxy SSE tới backend qua TLS
const SSE_URL =
  process.env.NEXT_PUBLIC_SSE_URL ?? "/notifications/sse";

/**
 * Kết nối SSE notification stream.
 * Trả về contextHolder cần render trong component cha để toast hoạt động.
 */
export function useNotificationHub() {
  const [api, contextHolder] = notification.useNotification();
  const token = useAuthStore((s) => s.accessToken);
  const push = useNotificationStore((s) => s.push);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token) {
      console.log("[NotificationSSE] no token — waiting for auth");
      return;
    }

    const url = `${SSE_URL}?access_token=${encodeURIComponent(token)}`;
    console.log("[NotificationSSE] connecting →", SSE_URL);

    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("notification", (e: MessageEvent) => {
      const envelope = JSON.parse(e.data) as SignalREnvelope<NotificationPayload>;
      console.log("[NotificationSSE] event →", envelope.type, envelope.payload);
      push(envelope.payload);
      api.info({
        message: envelope.payload.subject,
        description: envelope.payload.body,
        placement: "topRight",
        duration: 6,
      });
    });

    es.onerror = (err) => console.error("[NotificationSSE] error", err);

    return () => {
      es.close();
      esRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return contextHolder;
}
