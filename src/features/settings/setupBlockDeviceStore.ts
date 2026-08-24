import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorage } from '../../shared/storage';
import { isRecord } from '../../shared/validation';
import { SETUP_BLOCK_DEVICE_STORAGE_KEY } from './storageKeys';

interface SetupBlockDeviceState {
  readonly isEnabledOnDevice: boolean;
  readonly disableOnDevice: () => void;
  readonly enableOnDevice: () => void;
  readonly syncSetupBlockPresence: (setupBlockPresent: boolean) => void;
}

function mergePersistedDeviceState(
  state: unknown,
  current: SetupBlockDeviceState,
): SetupBlockDeviceState {
  if (state === undefined) return current;
  if (!isRecord(state) || typeof state.isEnabledOnDevice !== 'boolean') {
    throw new Error('Stored lock-in device state is invalid.');
  }
  return {
    ...current,
    isEnabledOnDevice: state.isEnabledOnDevice,
  };
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
      skipHydration: true,
      merge: mergePersistedDeviceState,
    },
  ),
);
