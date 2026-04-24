import { create } from 'zustand';
import { api } from '../../../convex/_generated/api';
import { convex } from '../../api/convex';
import type { SetupWindow } from './adminState';

interface SettingsActions {
  setSetupWindow: (window: SetupWindow) => Promise<void>;
  clearSetupWindow: () => Promise<void>;
}

export const useSettingsStore = create<SettingsActions>(() => ({
  setSetupWindow: async (window) => {
    await convex.mutation(api.settings.setSetupWindow, {
      window: {
        days: [...window.days],
        startTime: window.startTime,
        endTime: window.endTime,
      },
    });
  },
  clearSetupWindow: async () => {
    await convex.mutation(api.settings.clearSetupWindow);
  },
}));
