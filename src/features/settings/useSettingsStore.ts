import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { useFocusBlockStore } from '../schedule/useFocusBlockStore';
import type { SetupBlock } from './adminState';
import { validateSetupBlock } from './validation';

interface SettingsState {
  setupBlock: SetupBlock | null;
  setSetupBlock: (block: SetupBlock) => void;
  clearSetupBlock: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      setupBlock: null,
      setSetupBlock: (block) => {
        validateSetupBlock(block);
        set({ setupBlock: block });
        useFocusBlockStore.getState().clearAllStrict();
      },
      clearSetupBlock: () => set({ setupBlock: null }),
    }),
    {
      name: 'focusblocks.settings',
      storage: persistedStorage,
    },
  ),
);
