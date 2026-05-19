"use client";

import { useNotificationHub } from "./useNotificationHub";

/** Mount trong layout để giữ kết nối SignalR notification hub. */
export function NotificationHubProvider() {
  const contextHolder = useNotificationHub();
  return <>{contextHolder}</>;
}
