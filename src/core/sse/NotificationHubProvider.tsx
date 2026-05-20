"use client";

import { useNotificationHub } from "./useNotificationHub";

export function NotificationHubProvider() {
  const contextHolder = useNotificationHub();
  return <>{contextHolder}</>;
}
