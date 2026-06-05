'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Button, ConfigProvider, Form, Input, Spin, theme as antTheme } from 'antd';
import useAuthStore from '@/core/auth/authStore';
import { useLogin } from '@/core/auth/useLogin';
import { useThemeStore } from '@/store/themeStore';

// ─── Dashboard mock preview (right panel) ────────────────────────────────────

const CHART_BARS = [40, 65, 50, 85, 60, 75, 45, 90, 55, 80, 70, 95];

function DashboardPreview() {
  return (
    <div className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#0f172a]/90 border-b border-white/5">
        <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
          H
        </div>
        <span className="text-[11px] font-semibold text-slate-200 flex-1">HDOS Admin</span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
        </div>
      </div>

      <div className="bg-[#0a0f1a]/80 backdrop-blur-sm p-4 space-y-3">
        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: 'Bệnh nhân', value: '1,284', delta: '+12%', color: 'text-emerald-400', bar: 'bg-emerald-500' },
            { label: 'Lịch hẹn hôm nay', value: '87', delta: '+5%', color: 'text-blue-400', bar: 'bg-blue-500' },
            { label: 'Xét nghiệm', value: '342', delta: '−3%', color: 'text-amber-400', bar: 'bg-amber-500' },
          ].map((s) => (
            <div key={s.label} className="bg-[#1f2937]/70 rounded-xl p-3 space-y-1">
              <p className="text-[8px] text-slate-500 m-0 leading-tight">{s.label}</p>
              <p className={`text-[15px] font-bold m-0 leading-none ${s.color}`}>{s.value}</p>
              <div className="flex items-center gap-1">
                <div className={`h-0.5 flex-1 rounded-full ${s.bar} opacity-40`} />
                <span className="text-[8px] text-slate-500">{s.delta}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="bg-[#1f2937]/50 rounded-xl p-3">
          <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider m-0 mb-2.5">
            Hoạt động theo ngày
          </p>
          <div className="flex items-end gap-[3px] h-14">
            {CHART_BARS.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: i % 3 === 0
                    ? 'linear-gradient(to top, #059669, #34d39950)'
                    : 'linear-gradient(to top, #1f4a3c, #34d39920)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Mini patient list */}
        <div className="space-y-1">
          {[
            { name: 'Nguyễn Văn A', dept: 'Nội tổng quát', status: 'Đang chờ',   dot: 'bg-yellow-400' },
            { name: 'Trần Thị B',   dept: 'Tim mạch',      status: 'Đang khám',  dot: 'bg-emerald-400' },
            { name: 'Lê Văn C',     dept: 'Chỉnh hình',    status: 'Hoàn thành', dot: 'bg-blue-400' },
          ].map((row) => (
            <div key={row.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#1f2937]/40">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.dot}`} />
              <span className="text-[10px] text-slate-300 flex-1 min-w-0 truncate">{row.name}</span>
              <span className="text-[9px] text-slate-500 shrink-0">{row.dept}</span>
              <span className="text-[9px] text-slate-400 shrink-0 ml-2 w-16 text-right">{row.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { login, loading, error } = useLogin();
  const { theme } = useThemeStore();
  const dk = theme === 'dark';

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') ?? '/client';
      router.replace(redirect);
    }
  }, [isAuthenticated, router, searchParams]);

  if (isAuthenticated) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: dk ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary:       '#059669',
          colorPrimaryHover:  '#047857',
          colorPrimaryActive: '#065f46',
          colorBgContainer:   dk ? '#0f172a' : '#ffffff',
          colorBgElevated:    dk ? '#0f172a' : '#ffffff',
          colorBorder:        dk ? '#1f2937' : '#e5e7eb',
          colorText:          dk ? '#f1f5f9' : '#111827',
          colorTextSecondary: dk ? '#94a3b8' : '#6b7280',
          borderRadius:   10,
          borderRadiusLG: 14,
          borderRadiusSM: 8,
          fontSize:       13,
        },
        components: {
          Input: {
            colorBgContainer:  dk ? '#0a0f1a' : '#ffffff',
            activeBorderColor: '#059669',
            hoverBorderColor:  '#34d399',
          },
          Button: {
            colorPrimaryBg: '#059669',
          },
        },
      }}
    >
      <div className={`${dk ? 'dark' : ''} flex h-screen overflow-hidden`}>

        {/* ── Left: form panel ───────────────────────────────────────────────── */}
        <div className="w-full md:w-[460px] shrink-0 flex flex-col bg-white dark:bg-[#0f172a] border-r border-gray-100 dark:border-[#1f2937] overflow-y-auto">
          {/* Logo */}
          <div className="px-10 pt-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-600/25 shrink-0">
                H
              </div>
              <span className="font-bold text-gray-800 dark:text-slate-100 text-[15px] leading-none">
                HDOS
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 flex flex-col justify-center px-10 py-10">
            <div className="w-full max-w-[340px]">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50 m-0 mb-1 leading-tight">
                Chào mừng trở lại
              </h1>
              <p className="text-sm text-gray-400 dark:text-slate-400 m-0 mb-8">
                Nhập thông tin tài khoản tổ chức của bạn
              </p>

              {error && <Alert type="error" title={error} showIcon className="mb-5" />}

              <Form
                layout="vertical"
                onFinish={({ email, password }: { email: string; password: string }) =>
                  login(email, password)
                }
                requiredMark={false}
                autoComplete="on"
              >
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ required: true, message: 'Vui lòng nhập email' }]}
                >
                  <Input
                    type="email"
                    placeholder="admin@hospital.vn"
                    autoComplete="email"
                    size="large"
                  />
                </Form.Item>
                <Form.Item
                  name="password"
                  label="Mật khẩu"
                  rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
                >
                  <Input.Password
                    placeholder="••••••••"
                    autoComplete="current-password"
                    size="large"
                  />
                </Form.Item>
                <Form.Item className="mb-0 mt-2">
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    className="w-full"
                    loading={loading}
                  >
                    Đăng nhập
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 pb-8">
            <p className="text-[11px] text-gray-300 dark:text-slate-700 m-0">
              © 2025 HDOS — Hospital Digital Operating System
            </p>
          </div>
        </div>

        {/* ── Right: showcase panel (hidden on mobile) ───────────────────────── */}
        <div className="hidden md:flex flex-1 relative overflow-hidden bg-[#060c18] flex-col items-center justify-center p-12 gap-10">
          {/* Emerald glow blob */}
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(5,150,105,0.18) 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)' }}
          />

          {/* Text */}
          <div className="relative z-10 max-w-lg">
            <h2 className="text-[32px] font-bold text-white leading-snug m-0 mb-3">
              Quản lý toàn diện hoạt động bệnh viện số
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed m-0">
              Hệ thống tập trung dữ liệu bệnh nhân, lịch hẹn, xét nghiệm và báo cáo —
              tất cả trên một nền tảng thống nhất, thời gian thực.
            </p>
          </div>

          {/* Dashboard preview */}
          <div className="relative z-10 w-full max-w-[420px]">
            <DashboardPreview />
          </div>
        </div>

      </div>
    </ConfigProvider>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#060c18]">
          <Spin size="large" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
