import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { useFocusBlockStore } from '../schedule/useFocusBlockStore';
import type { SetupBlock } from './adminState';
import { SETTINGS_STORAGE_KEY } from './storageKeys';
import { validateSetupBlock } from './validation';

interface SettingsState {
  readonly setupBlock: SetupBlock | null;
  readonly setSetupBlock: (block: SetupBlock) => void;
  readonly clearSetupBlock: () => void;
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
      name: SETTINGS_STORAGE_KEY,
      storage: persistedStorage,
    },
  ),
);
