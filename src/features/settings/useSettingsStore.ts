import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import type { SetupWindow } from './adminState';
import { validateSetupWindow } from './validation';

interface SettingsState {
  setupWindow: SetupWindow | null;
  setSetupWindow: (window: SetupWindow) => void;
  clearSetupWindow: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      setupWindow: null,
      setSetupWindow: (window) => {
        validateSetupWindow(window);
        set({ setupWindow: window });
      },
      clearSetupWindow: () => set({ setupWindow: null }),
    }),
    {
      name: 'fucus.settings',
      storage: persistedStorage,
    },
  ),
);
