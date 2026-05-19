import axios from 'axios';
import { getKeycloak } from '@/core/auth/keycloakClient';
import useAuthStore from '@/core/auth/authStore';

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
  timeout: 15_000,
});

httpClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const kc = getKeycloak();

      if (kc?.authenticated) {
        try {
          const refreshed = await kc.updateToken(30);
          if (refreshed && kc.token) {
            useAuthStore.getState().setAuthFromKeycloak(kc);
            originalRequest.headers.Authorization = `Bearer ${kc.token}`;
            return httpClient(originalRequest);
          }
        } catch {
          useAuthStore.getState().clearAuth();
          kc.login({ redirectUri: window.location.href });
          return Promise.reject(error);
        }
      }

      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default httpClient;
