import axios from 'axios';
import useAuthStore from '@/core/auth/authStore';

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'https://192.168.100.60:8443',
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
  (error) => {
    // Only redirect on 401 if we had an active session (token expired server-side)
    if (error.response?.status === 401 && useAuthStore.getState().accessToken) {
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
