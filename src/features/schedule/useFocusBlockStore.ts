import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { clearSlot } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import { assertAdminUnlocked } from '../settings/adminState';
import { useSetupBlockDeviceStore } from '../settings/setupBlockDeviceStore';
import { useSettingsStore } from '../settings/useSettingsStore';
import { focusBlockRunnableLocally } from './localRuntime';
import { getFocusBlockRuntimeStatus } from './runtimeStatus';
import type { FocusBlock, FocusBlockInput, FocusBlockRule } from './types';
import { useBlockActivationStore } from './useBlockActivationStore';
import { validateFocusBlockInput } from './validation';

interface FocusBlockState {
  readonly focusBlocks: readonly FocusBlock[];
  readonly addFocusBlock: (id: string, input: FocusBlockInput) => void;
  readonly updateFocusBlock: (id: string, input: FocusBlockInput) => void;
  readonly deleteFocusBlock: (id: string) => void;
  readonly clearAllStrict: () => void;
}

function assertEditable(block: FocusBlock): void {
  const now = new Date();
  const blockOnThisDevice = focusBlockRunnableLocally(
    block,
    useBlockActivationStore.getState().isBlockEnabled(block.id),
  );
  if (getFocusBlockRuntimeStatus(blockOnThisDevice, now).kind === 'active') {
    throw new Error('Cannot change a block while it is active.');
  }
  if (!blockOnThisDevice.isEnabled) {
    return;
  }
  assertAdminUnlocked(
    useSettingsStore.getState().setupBlock,
    useSetupBlockDeviceStore.getState().isEnabledOnDevice,
    now,
  );
}

function normalizeInput(input: FocusBlockInput): FocusBlockInput {
  const setupBlock = useSettingsStore.getState().setupBlock;
  return setupBlock === null ? input : { ...input, strict: false };
}

interface PersistedFocusBlock {
  readonly id: string;
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly days: FocusBlock['days'];
  readonly rule: FocusBlockRule;
  readonly selection: FocusBlock['selection'];
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly strict: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePersistedBlock(value: unknown): FocusBlock {
  if (!isRecord(value)) {
    throw new Error('Stored focus block is invalid.');
  }

  const block = value as Partial<PersistedFocusBlock>;
  if (
    typeof block.id !== 'string' ||
    typeof block.name !== 'string' ||
    typeof block.startTime !== 'string' ||
    typeof block.endTime !== 'string' ||
    !Array.isArray(block.days) ||
    !isRecord(block.rule) ||
    !isRecord(block.selection) ||
    typeof block.notifyOnStart !== 'boolean' ||
    typeof block.notifyOnEnd !== 'boolean' ||
    typeof block.strict !== 'boolean'
  ) {
    throw new Error('Stored focus block is invalid.');
  }

  const parsed = {
    id: block.id,
    name: block.name,
    startTime: block.startTime,
    endTime: block.endTime,
    days: block.days,
    rule: block.rule,
    selection: block.selection,
    notifyOnStart: block.notifyOnStart,
    notifyOnEnd: block.notifyOnEnd,
    strict: block.strict,
  };
  validateFocusBlockInput(parsed);
  return parsed;
}

function mergePersistedState(
  state: unknown,
  current: FocusBlockState,
): FocusBlockState {
  const persisted = state as {
    readonly focusBlocks?: readonly unknown[];
  };
  return {
    ...current,
    focusBlocks: (persisted.focusBlocks ?? []).map(parsePersistedBlock),
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

      updateFocusBlock: (id, input) => {
        const normalized = normalizeInput(input);
        validateFocusBlockInput(normalized);
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (!existing) {
          throw new Error('Focus block not found.');
        }
        assertEditable(existing);
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id
              ? { ...normalized, id, name: normalized.name.trim() }
              : b,
          ),
        }));
      },

      deleteFocusBlock: (id) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (existing) {
          assertEditable(existing);
        }
        clearSlot(selectionIdForBlock(id));
        useBlockActivationStore.getState().setBlockEnabled(id, false);
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
      merge: mergePersistedState,
    },
  ),
);
