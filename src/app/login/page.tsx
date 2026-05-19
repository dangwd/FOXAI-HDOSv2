'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Spin } from 'antd';
import useAuthStore from '@/core/auth/authStore';
import { authService } from '@/core/auth/authService';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') ?? '/hdos';
      router.replace(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  // Đã authenticated → không render nội dung login, tránh flash trước khi effect redirect
  if (isAuthenticated) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-[#010409] gap-8">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          H
        </div>
        <div>
          <p className="text-xl font-bold text-gray-800 dark:text-[#e6edf3] m-0 leading-tight">HDOS</p>
          <p className="text-xs text-gray-400 dark:text-[#8b949e] m-0">Hospital Digital Operating System</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-8 shadow-sm flex flex-col items-center gap-6">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-800 dark:text-[#e6edf3] m-0">Đăng nhập</p>
          <p className="text-sm text-gray-400 dark:text-[#8b949e] mt-1 m-0">
            Sử dụng tài khoản tổ chức của bạn
          </p>
        </div>

        <Button
          type="primary"
          size="large"
          className="w-full"
          onClick={() => authService.login()}
        >
          Đăng nhập với Keycloak
        </Button>

        <p className="text-xs text-gray-400 dark:text-[#8b949e] text-center m-0">
          Bạn sẽ được chuyển đến trang đăng nhập bảo mật của tổ chức
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
