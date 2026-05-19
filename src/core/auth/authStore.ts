import { create } from 'zustand';
import type Keycloak from 'keycloak-js';
import type { User } from './types';
import { resolvePermissions } from './rolePermissions';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: Set<string>;
  isAuthenticated: boolean;

  setAuthFromKeycloak: (kc: Keycloak) => void;
  clearAuth: () => void;
  expireAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

const COOKIE_NAME = 'auth_token';
const STORAGE_KEY = 'auth_user';

function setCookie(value: string, expUnix: number): void {
  const expires = new Date(expUnix * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${value}; path=/; SameSite=Lax; expires=${expires}`;
}

function expireCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  permissions: new Set<string>(),
  isAuthenticated: false,

  setAuthFromKeycloak(kc: Keycloak) {
    const parsed = kc.tokenParsed as Record<string, unknown> | undefined;
    if (!kc.token || !parsed) return;

    const roles = (parsed['roles'] as string[] | undefined) ?? [];
    const user: User = {
      id:    String(parsed['sub']   ?? ''),
      email: String(parsed['email'] ?? ''),
      name:  parsed['name'] as string | undefined,
    };
    const exp = parsed['exp'] as number | undefined;

    if (exp) setCookie(kc.token, exp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

    set({
      user,
      accessToken: kc.token,
      permissions: resolvePermissions(roles),
      isAuthenticated: true,
    });
  },

  clearAuth() {
    expireCookie();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* SSR */ }
    set({
      user: null,
      accessToken: null,
      permissions: new Set<string>(),
      isAuthenticated: false,
    });
  },

  // Chỉ expire cookie + localStorage, KHÔNG update Zustand state.
  // Dùng khi logout chủ động để tránh trigger AppProviders redirect
  // trước khi kc.logout() kịp invalidate session trên Keycloak.
  expireAuth() {
    expireCookie();
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* SSR */ }
  },

  hasPermission(permission: string): boolean {
    return get().permissions.has(permission);
  },
}));

export default useAuthStore;
