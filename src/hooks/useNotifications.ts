'use client';
import { useQuery } from '@tanstack/react-query';
import httpClient from '@/infrastructure/http/httpClient';
import type { NotificationsResponse, NotificationRecord } from '@/types/notification';

async function fetchNotifications(take: number): Promise<NotificationRecord[]> {
  const { data } = await httpClient.get<NotificationsResponse>('/notifications', {
    params: { take },
  });
  return data.data ?? [];
}

export function useNotifications(take = 50) {
  return useQuery({
    queryKey: ['notifications', take],
    queryFn: () => fetchNotifications(take),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
