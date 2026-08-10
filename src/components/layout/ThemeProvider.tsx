'use client';

import { useEffect } from 'react';
import { useFamilyStore } from '@/store/familyStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { family } = useFamilyStore();

  useEffect(() => {
    const root = document.documentElement;
    // We default to dark mode across the app, but if explicitly set to light, we remove it
    // Wait, the globals.css uses .dark to define the dark variables.
    // If we want dark mode by default before family loads:
    
    if (family) {
      if (family.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      // Default initial state
      root.classList.add('dark');
    }
  }, [family?.theme]);

  return <>{children}</>;
}
