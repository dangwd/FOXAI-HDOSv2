'use client';
import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import useAuthStore from '@/core/auth/authStore';

interface Props {
  children: React.ReactNode;
}

export function AppProviders({ children }: Props) {
  const [isRehydrated, setIsRehydrated] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevIsAuthenticated = useRef<boolean | null>(null);

  useEffect(() => {
    useAuthStore.getState().rehydrate();
    setIsRehydrated(true);
  }, []);

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

  return <>{children}</>;
}
