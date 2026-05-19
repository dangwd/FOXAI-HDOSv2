'use client';
import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { getKeycloak, initKeycloak } from '@/core/auth/keycloakClient';
import useAuthStore from '@/core/auth/authStore';

interface Props {
  children: React.ReactNode;
}

export function AppProviders({ children }: Props) {
  const [isRehydrated, setIsRehydrated] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevIsAuthenticated = useRef<boolean | null>(null);

  // Init Keycloak on mount + set onTokenExpired handler
  useEffect(() => {
    const kc = getKeycloak();

    initKeycloak().then((authenticated) => {
      if (authenticated && kc) {
        useAuthStore.getState().setAuthFromKeycloak(kc);
      }
      setIsRehydrated(true);
    });

    if (kc) {
      kc.onTokenExpired = () => {
        kc.updateToken(60)
          .then((refreshed) => {
            if (refreshed && kc.token) {
              useAuthStore.getState().setAuthFromKeycloak(kc);
            }
          })
          .catch(() => useAuthStore.getState().clearAuth());
      };
    }
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
