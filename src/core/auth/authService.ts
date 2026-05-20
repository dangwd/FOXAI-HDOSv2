import httpClient from '@/infrastructure/http/httpClient';
import useAuthStore from './authStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { User } from './types';

interface LoginApiResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    token: string;
  } | null;
  errorCode: string | null;
  errorMessage: string | null;
}

function parseNameFromJwt(token: string): string | undefined {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    return payload['name'] as string | undefined;
  } catch {
    return undefined;
  }
}

export const authService = {
  async login(email: string, password: string): Promise<void> {
    const res = await httpClient.post<LoginApiResponse>('/auth/login', { email, password });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.errorMessage ?? 'Đăng nhập thất bại');
    }
    const { token, userId, email: userEmail } = res.data.data;
    const user: User = { id: userId, email: userEmail, name: parseNameFromJwt(token) };
    useAuthStore.getState().setAuth(token, user);
  },

  logout(): void {
    useNotificationStore.getState().clearAll();
    useAuthStore.getState().clearAuth();
    window.location.href = '/login';
  },
};
