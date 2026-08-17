'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function checkAccess() {
      const isAuthRoute = pathname === '/login' || pathname === '/signup';
      const hasFlag = window.localStorage.getItem('guardian-web-auth') === 'true';

      if (isAuthRoute) {
        if (isActive) {
          setReady(true);
        }
        return;
      }

      if (hasFlag) {
        if (isActive) {
          setReady(true);
        }
        return;
      }

      if (!supabase) {
        if (isActive) {
          router.replace('/login');
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isActive) {
        return;
      }

      if (data.session) {
        setReady(true);
      } else {
        router.replace('/login');
      }
    }

    checkAccess();

    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          window.localStorage.removeItem('guardian-web-auth');
          if (isActive) router.replace('/login');
        }
      });
      subscription = data.subscription;
    }

    return () => {
      isActive = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!ready && pathname !== '/login' && pathname !== '/signup') {
    return null;
  }

  return <>{children}</>;
}
