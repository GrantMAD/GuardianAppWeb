import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Family, Child } from '@/types';

interface FamilyState {
  family: Family | null;
  children: Child[];
  selectedChildId: string | null;
  // Actions
  setFamily: (family: Family | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChildId: (id: string | null) => void;
  clearFamily: () => void;
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      family: null,
      children: [],
      selectedChildId: null,
      setFamily: (family) => set({ family }),
      setChildren: (children) => set({ children }),
      setSelectedChildId: (id) => set({ selectedChildId: id }),
      clearFamily: () =>
        set({ family: null, children: [], selectedChildId: null }),
    }),
    {
      name: 'guardian-web-family-store',
      // Only persist selected child — family/children come from DB on mount
      partialize: (state) => ({ selectedChildId: state.selectedChildId }),
    },
  ),
);
