import { getKeycloak } from './keycloakClient';
import useAuthStore from './authStore';
import { useNotificationStore } from '@/store/notificationStore';

export const authService = {
  login(redirectUri?: string): void {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    getKeycloak()?.login({ redirectUri: redirectUri ?? `${origin}/hdos` });
  },

  async logout(): Promise<void> {
    useAuthStore.getState().clearAuth();
    useNotificationStore.getState().clearAll();

    const kc = getKeycloak();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (kc?.authenticated) {
      kc.logout({ redirectUri: `${origin}/login` }).catch(() => {
        window.location.href = '/login';
      });
    } else {
      window.location.href = '/login';
    }
  },
};
