import './globals.css';
import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth/AuthGate';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { ToastProvider } from '@/hooks/useToast';
import { Toaster } from '@/components/ui/Toaster';

export const metadata: Metadata = {
  title: 'Guardian Web Dashboard',
  description: 'Parent dashboard for GuardianApp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <AuthGate>{children}</AuthGate>
            <Toaster />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

