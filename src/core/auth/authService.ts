import { getKeycloak } from './keycloakClient';
import useAuthStore from './authStore';
import { useNotificationStore } from '@/store/notificationStore';

export const authService = {
  login(redirectUri?: string): void {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    getKeycloak()?.login({ redirectUri: redirectUri ?? `${origin}/hdos` });
  },

  async logout(): Promise<void> {
    // Expire cookie trước để middleware cho phép /login sau khi Keycloak redirect về.
    // Không gọi clearAuth() vì nó set isAuthenticated=false → AppProviders effect
    // redirect /login ngay lập tức, race với kc.logout() và bỏ qua việc invalidate
    // session trên Keycloak server → check-sso lần sau vẫn tự login lại.
    useAuthStore.getState().expireAuth();
    useNotificationStore.getState().clearAll();

    const kc = getKeycloak();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (kc?.authenticated) {
      kc.logout({ redirectUri: `${origin}/login` }).catch(() => {
        window.location.href = '/login';
      });
    } else {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
  },
};
