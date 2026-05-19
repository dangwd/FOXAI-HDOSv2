import type { Metadata } from 'next';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ThemeProvider } from '@/components/Layout/ThemeProvider';
import { AppProviders } from '@/core/providers/AppProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'HDOS — Hospital Digital Operating System',
  description: 'Hệ thống vận hành bệnh viện số',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full">
        <AntdRegistry>
          <ThemeProvider>
            <AppProviders>
              {children}
            </AppProviders>
          </ThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
