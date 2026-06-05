import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface QuickStartState {
  readonly hasCompletedQuickStart: boolean;
  readonly completeQuickStart: () => void;
}

export const useQuickStartStore = create<QuickStartState>()(
  persist(
    (set) => ({
      hasCompletedQuickStart: false,
      completeQuickStart: () => set({ hasCompletedQuickStart: true }),
    }),
    {
      name: 'focusblocks.quick-start',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
