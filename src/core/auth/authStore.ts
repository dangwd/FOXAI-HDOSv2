import { create } from 'zustand';
import type { User } from './types';
import { resolvePermissions } from './rolePermissions';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: Set<string>;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User, roles?: string[]) => void;
  rehydrate: () => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
}

const COOKIE_NAME = 'auth_token';
const STORAGE_TOKEN_KEY = 'auth_access_token';
const STORAGE_USER_KEY = 'auth_user';

function setCookie(value: string, expUnix: number): void {
  const expires = new Date(expUnix * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${value}; path=/; SameSite=Lax; expires=${expires}`;
}

function expireCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  permissions: new Set<string>(),
  isAuthenticated: false,

  setAuth(token: string, user: User, roles: string[] = []) {
    const payload = parseJwt(token);
    const exp = payload?.exp as number | undefined;
    if (exp) setCookie(token, exp);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } catch { /* SSR */ }
    set({
      user,
      accessToken: token,
      permissions: resolvePermissions(roles),
      isAuthenticated: true,
    });
  },

  rehydrate() {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem(STORAGE_TOKEN_KEY);
      const userRaw = localStorage.getItem(STORAGE_USER_KEY);
      if (!token || !userRaw) return;

      const payload = parseJwt(token);
      const exp = payload?.exp as number | undefined;
      if (!exp || exp * 1000 <= Date.now()) {
        expireCookie();
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_USER_KEY);
        return;
      }

      setCookie(token, exp);
      set({
        user: JSON.parse(userRaw) as User,
        accessToken: token,
        permissions: new Set<string>(),
        isAuthenticated: true,
      });
    } catch { /* ignore parse errors */ }
  },

  clearAuth() {
    expireCookie();
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch { /* SSR */ }
    set({
      user: null,
      accessToken: null,
      permissions: new Set<string>(),
      isAuthenticated: false,
    });
  },

  hasPermission(permission: string): boolean {
    return get().permissions.has(permission);
  },
}));

export default useAuthStore;
