'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useFamilyStore } from '@/store/familyStore';
import { getFamily, getChildren } from '@/lib/child-service';
import { supabase } from '@/lib/supabase';

/**
 * Runs once on dashboard mount.
 * Loads the authenticated parent's family + children into the Zustand store.
 * Redirects to /onboarding if family hasn't completed setup.
 */
export function useFamilyBootstrap() {
  const router = useRouter();
  const { family, setFamily, children, setChildren, setSelectedChildId, selectedChildId } =
    useFamilyStore();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    (async () => {
      try {
        let fam = family;

        if (!fam) {
          fam = await getFamily();
          if (!fam) {
            // Auto-create a family for new users who bypassed onboarding
            const { data: { user } } = await supabase!.auth.getUser();
            const name = user?.user_metadata?.family_name ?? 'My Family';
            const { createFamily } = await import('@/lib/child-service');
            fam = await createFamily(name);
          }
          if (fam) setFamily(fam);
        }

        if (fam) {
          if (!fam.has_completed_onboarding) {
            router.replace('/onboarding');
            return;
          }

          const kids = await getChildren(fam.id);
          setChildren(kids);

          // Auto-select first child if none selected
          if (!selectedChildId && kids.length > 0) {
            setSelectedChildId(kids[0].id);
          }
        }
      } catch (err) {
        console.error('Family bootstrap failed:', err);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { family, children };
}
