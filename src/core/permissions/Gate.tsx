'use client';
import type { ReactNode } from 'react';
import useAuthStore from '@/core/auth/authStore';

interface GateProps {
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Gate({ permission, fallback = null, children }: GateProps) {
  const allowed = useAuthStore((s) => s.permissions.has(permission));
  return allowed ? <>{children}</> : <>{fallback}</>;
}
