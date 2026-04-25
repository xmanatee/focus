import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { clearSlot } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import { assertAdminUnlocked } from '../settings/adminState';
import { useSettingsStore } from '../settings/useSettingsStore';
import { isFocusBlockActiveAt } from './activeness';
import type { FocusBlock, FocusBlockInput } from './types';
import { validateFocusBlockInput } from './validation';

interface FocusBlockState {
  focusBlocks: FocusBlock[];
  addFocusBlock: (id: string, input: FocusBlockInput) => void;
  updateFocusBlock: (id: string, input: FocusBlockInput) => void;
  toggleFocusBlock: (id: string, isEnabled: boolean) => void;
  deleteFocusBlock: (id: string) => void;
  clearAllStrict: () => void;
}

function assertEditable(block: FocusBlock): void {
  const now = new Date();
  if (isFocusBlockActiveAt(block, now)) {
    throw new Error('Cannot change a block while it is active.');
  }
  assertAdminUnlocked(useSettingsStore.getState().setupBlock, now);
}

function normalizeInput(input: FocusBlockInput): FocusBlockInput {
  const setupBlock = useSettingsStore.getState().setupBlock;
  return setupBlock === null ? input : { ...input, strict: false };
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

      toggleFocusBlock: (id, isEnabled) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (!existing) {
          throw new Error('Focus block not found.');
        }
        assertEditable(existing);
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id ? { ...b, isEnabled } : b,
          ),
        }));
      },

      deleteFocusBlock: (id) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (existing) {
          assertEditable(existing);
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
    },
  ),
);
