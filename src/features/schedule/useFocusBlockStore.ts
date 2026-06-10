import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { clearSlot } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import { assertAdminUnlocked } from '../settings/adminState';
import { useSettingsStore } from '../settings/useSettingsStore';
import {
  enabledDeviceIdsAfterToggle,
  normalizeEnabledDeviceIds,
} from './deviceActivation';
import { focusBlockRunnableOnDevice } from './deviceRuntime';
import { getFocusBlockRuntimeStatus } from './runtimeStatus';
import type {
  FocusBlock,
  FocusBlockInput,
  FocusBlockRule,
  FocusBlockScope,
} from './types';
import { validateFocusBlockInput } from './validation';

interface FocusBlockState {
  readonly focusBlocks: readonly FocusBlock[];
  readonly addFocusBlock: (id: string, input: FocusBlockInput) => void;
  readonly updateFocusBlock: (
    id: string,
    input: FocusBlockInput,
    deviceId: string,
  ) => void;
  readonly toggleFocusBlock: (
    id: string,
    deviceId: string,
    isEnabled: boolean,
  ) => void;
  readonly deleteFocusBlock: (id: string, deviceId: string) => void;
  readonly clearAllStrict: () => void;
}

function assertEditable(block: FocusBlock, deviceId: string): void {
  const now = new Date();
  const blockOnThisDevice = focusBlockRunnableOnDevice(block, deviceId);
  if (getFocusBlockRuntimeStatus(blockOnThisDevice, now).kind === 'active') {
    throw new Error('Cannot change a block while it is active.');
  }
  assertAdminUnlocked(useSettingsStore.getState().setupBlock, now);
}

function normalizeInput(input: FocusBlockInput): FocusBlockInput {
  const setupBlock = useSettingsStore.getState().setupBlock;
  const normalized = {
    ...input,
    enabledDeviceIds: normalizeEnabledDeviceIds(input.enabledDeviceIds),
  };
  return setupBlock === null ? normalized : { ...normalized, strict: false };
}

interface PersistedFocusBlock {
  readonly id: string;
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly days: FocusBlock['days'];
  readonly isEnabled: boolean;
  readonly enabledDeviceIds?: FocusBlock['enabledDeviceIds'];
  readonly scope?: FocusBlockScope;
  readonly rule?: FocusBlockRule;
  readonly selection: FocusBlock['selection'];
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly strict: boolean;
}

function normalizePersistedBlock(block: PersistedFocusBlock): FocusBlock {
  return {
    ...block,
    enabledDeviceIds: normalizeEnabledDeviceIds(block.enabledDeviceIds ?? []),
    scope: block.scope ?? { kind: 'allDevices' },
    rule: block.rule ?? { kind: 'blockDuringSchedule' },
  };
}

function migratePersistedState(state: unknown): FocusBlockState {
  const persisted = state as Omit<FocusBlockState, 'focusBlocks'> & {
    readonly focusBlocks: readonly PersistedFocusBlock[];
  };
  return {
    ...persisted,
    focusBlocks: persisted.focusBlocks.map(normalizePersistedBlock),
  };
}

export const useFocusBlockStore = create<FocusBlockState>()(
  persist(
    (set, get) => ({
      focusBlocks: [],

      addFocusBlock: (id, input) => {
        const normalized = normalizeInput(input);
        validateFocusBlockInput(normalized);
        set((state) => ({
          focusBlocks: [
            ...state.focusBlocks,
            { ...normalized, id, name: normalized.name.trim() },
          ],
        }));
      },

      updateFocusBlock: (id, input, deviceId) => {
        const normalized = normalizeInput(input);
        validateFocusBlockInput(normalized);
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (!existing) {
          throw new Error('Focus block not found.');
        }
        assertEditable(existing, deviceId);
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id
              ? { ...normalized, id, name: normalized.name.trim() }
              : b,
          ),
        }));
      },

      toggleFocusBlock: (id, deviceId, isEnabled) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (!existing) {
          throw new Error('Focus block not found.');
        }
        assertEditable(existing, deviceId);
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id
              ? {
                  ...b,
                  isEnabled: isEnabled ? true : b.isEnabled,
                  enabledDeviceIds: enabledDeviceIdsAfterToggle(
                    b.enabledDeviceIds,
                    deviceId,
                    isEnabled,
                  ),
                }
              : b,
          ),
        }));
      },

      deleteFocusBlock: (id, deviceId) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (existing) {
          assertEditable(existing, deviceId);
        }
        clearSlot(selectionIdForBlock(id));
        set((state) => ({
          focusBlocks: state.focusBlocks.filter((b) => b.id !== id),
        }));
      },

      clearAllStrict: () => {
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.strict ? { ...b, strict: false } : b,
          ),
        }));
      },
    }),
    {
      name: 'focusblocks.focus-blocks',
      storage: persistedStorage,
      version: 2,
      migrate: migratePersistedState,
    },
  ),
);
