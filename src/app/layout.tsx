import './globals.css';
import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth/AuthGate';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export const metadata: Metadata = {
  title: 'Guardian Web Dashboard',
  description: 'Parent dashboard for GuardianApp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthGate>{children}</AuthGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
