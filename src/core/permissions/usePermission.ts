import useAuthStore from '@/core/auth/authStore';

export function usePermission(permission: string): boolean {
  return useAuthStore((s) => s.permissions.has(permission));
}
