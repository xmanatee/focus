import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorage } from '../../shared/storage';
import { SETUP_BLOCK_DEVICE_STORAGE_KEY } from './storageKeys';

interface SetupBlockDeviceState {
  readonly hasResolvedInitialState: boolean;
  readonly initialDeviceActivation: boolean | null;
  readonly isEnabledOnDevice: boolean;
  readonly disableOnDevice: () => void;
  readonly enableOnDevice: () => void;
  readonly initialize: (initialDeviceActivation: boolean) => void;
  readonly syncSetupBlockPresence: (setupBlockPresent: boolean) => void;
}

export const useSetupBlockDeviceStore = create<SetupBlockDeviceState>()(
  persist(
    (set) => ({
      hasResolvedInitialState: false,
      initialDeviceActivation: null,
      isEnabledOnDevice: false,

      disableOnDevice: () =>
        set({
          hasResolvedInitialState: true,
          isEnabledOnDevice: false,
        }),

      enableOnDevice: () =>
        set({
          hasResolvedInitialState: true,
          isEnabledOnDevice: true,
        }),

      initialize: (initialDeviceActivation) =>
        set((state) =>
          state.initialDeviceActivation !== null
            ? state
            : { initialDeviceActivation },
        ),

      syncSetupBlockPresence: (setupBlockPresent) =>
        set((state) => {
          // Preserve old installs once, then require explicit per-device
          // enablement whenever a synced setup block appears in the future.
          if (!setupBlockPresent) {
            return state.isEnabledOnDevice
              ? { isEnabledOnDevice: false }
              : state;
          }
          if (
            state.hasResolvedInitialState ||
            state.initialDeviceActivation === null
          ) {
            return state;
          }
          return {
            hasResolvedInitialState: true,
            isEnabledOnDevice: state.initialDeviceActivation,
          };
        }),
    }),
    {
      name: SETUP_BLOCK_DEVICE_STORAGE_KEY,
      storage: localStorage,
    },
  ),
);
