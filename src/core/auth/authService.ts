import { getKeycloak } from './keycloakClient';
import useAuthStore from './authStore';

export const authService = {
  login(redirectUri?: string): void {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    getKeycloak()?.login({ redirectUri: redirectUri ?? `${origin}/login` });
  },

  async logout(): Promise<void> {
    useAuthStore.getState().clearAuth();

    const kc = getKeycloak();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (kc?.authenticated) {
      await kc.logout({ redirectUri: `${origin}/login` });
    } else {
      window.location.href = '/login';
    }
  },
};
