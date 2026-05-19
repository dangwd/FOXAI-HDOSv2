"use client";

import { useEffect, useRef } from "react";
import { notification } from "antd";
import * as signalR from "@microsoft/signalr";
import useAuthStore from "@/core/auth/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import type { SignalREnvelope, NotificationPayload } from "./types";

const HUB_URL =
  process.env.NEXT_PUBLIC_SIGNALR_URL ??
  "/notifications/hubs/notifications";

/**
 * Kết nối SignalR hub thông báo.
 * Trả về contextHolder cần render trong component cha để toast hoạt động.
 */
export function useNotificationHub() {
  const [api, contextHolder] = notification.useNotification();
  const token = useAuthStore((s) => s.accessToken);
  const push = useNotificationStore((s) => s.push);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!token) {
      console.log("[NotificationHub] no token — waiting for auth");
      return;
    }

    console.log("[NotificationHub] connecting →", HUB_URL);

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    connection.onreconnecting(() => console.log("[NotificationHub] reconnecting…"));
    connection.onreconnected(() => console.log("[NotificationHub] reconnected ✓"));
    connection.onclose((err) => console.log("[NotificationHub] closed", err ?? ""));

    connection.on("notification", (envelope: SignalREnvelope<NotificationPayload>) => {
      console.log("[NotificationHub] event →", envelope.type, envelope.payload);
      push(envelope.payload);
      api.info({
        message: envelope.payload.subject,
        description: envelope.payload.body,
        placement: "topRight",
        duration: 6,
      });
    });

    connection
      .start()
      .then(() => console.log("[NotificationHub] connected ✓ id:", connection.connectionId))
      .catch((err) => console.error("[NotificationHub] connect failed:", err));

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return contextHolder;
}
