'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from './authService';

export function useLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      await authService.login(email, password);
      const redirect = searchParams.get('redirect') ?? '/hdos';
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error };
}
