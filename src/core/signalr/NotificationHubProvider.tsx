"use client";

import { useNotificationHub } from "./useNotificationHub";

/** Mount trong layout để giữ kết nối SSE notification stream. */
export function NotificationHubProvider() {
  const contextHolder = useNotificationHub();
  return <>{contextHolder}</>;
}
