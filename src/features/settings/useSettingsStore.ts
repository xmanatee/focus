import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { isRecord } from '../../shared/validation';
import type { SetupBlock } from './adminState';
import { SETTINGS_STORAGE_KEY } from './storageKeys';
import { validateSetupBlock } from './validation';

interface SettingsState {
  readonly setupBlock: SetupBlock | null;
}

function mergePersistedSettings(
  state: unknown,
  current: SettingsState,
): SettingsState {
  if (state === undefined) return current;
  if (!isRecord(state)) {
    throw new Error('Stored settings are invalid.');
  }
  if (state.setupBlock === null) return { ...current, setupBlock: null };
  if (
    !isRecord(state.setupBlock) ||
    !Array.isArray(state.setupBlock.days) ||
    typeof state.setupBlock.startTime !== 'string' ||
    typeof state.setupBlock.endTime !== 'string' ||
    typeof state.setupBlock.notifyOnStart !== 'boolean'
  ) {
    throw new Error('Stored setup block is invalid.');
  }

  const setupBlock: SetupBlock = {
    days: state.setupBlock.days as SetupBlock['days'],
    startTime: state.setupBlock.startTime,
    endTime: state.setupBlock.endTime,
    notifyOnStart: state.setupBlock.notifyOnStart,
  };
  validateSetupBlock(setupBlock);
  return { ...current, setupBlock };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    () => ({
      setupBlock: null,
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: persistedStorage,
      skipHydration: true,
      merge: mergePersistedSettings,
    },
  ),
);
