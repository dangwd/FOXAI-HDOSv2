'use client';
import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@/core/auth/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

interface Props {
  children: React.ReactNode;
}

export function AppProviders({ children }: Props) {
  const [isRehydrated] = useState(() => {
    useAuthStore.getState().rehydrate();
    return true;
  });
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevIsAuthenticated = useRef<boolean | null>(null);

  // Redirect to /login when session expires (isAuthenticated flips true → false)
  useEffect(() => {
    if (!isRehydrated) return;
    if (prevIsAuthenticated.current === true && !isAuthenticated) {
      window.location.href = '/login';
    }
    prevIsAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, isRehydrated]);

  if (!isRehydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#010409]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
