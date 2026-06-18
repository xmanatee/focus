import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorage } from '../../shared/storage';
import { SETUP_BLOCK_DEVICE_STORAGE_KEY } from './storageKeys';

interface SetupBlockDeviceState {
  readonly isEnabledOnDevice: boolean;
  readonly disableOnDevice: () => void;
  readonly enableOnDevice: () => void;
  readonly syncSetupBlockPresence: (setupBlockPresent: boolean) => void;
}

export const useSetupBlockDeviceStore = create<SetupBlockDeviceState>()(
  persist(
    (set) => ({
      isEnabledOnDevice: false,

      disableOnDevice: () =>
        set({
          isEnabledOnDevice: false,
        }),

      enableOnDevice: () =>
        set({
          isEnabledOnDevice: true,
        }),

      syncSetupBlockPresence: (setupBlockPresent) =>
        set((state) =>
          setupBlockPresent || !state.isEnabledOnDevice
            ? state
            : { isEnabledOnDevice: false },
        ),
    }),
    {
      name: SETUP_BLOCK_DEVICE_STORAGE_KEY,
      storage: localStorage,
    },
  ),
);
