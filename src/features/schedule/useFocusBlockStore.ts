import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { clearSlot } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import { isFocusBlockActiveAt } from './activeness';
import type { FocusBlock, FocusBlockInput } from './types';
import { validateFocusBlockInput } from './validation';

interface FocusBlockState {
  focusBlocks: FocusBlock[];
  addFocusBlock: (id: string, input: FocusBlockInput) => void;
  updateFocusBlock: (id: string, input: FocusBlockInput) => void;
  toggleFocusBlock: (id: string, isEnabled: boolean) => void;
  deleteFocusBlock: (id: string) => void;
}

function assertNotActive(block: FocusBlock, message: string): void {
  if (isFocusBlockActiveAt(block, new Date())) {
    throw new Error(message);
  }
}

export const useFocusBlockStore = create<FocusBlockState>()(
  persist(
    (set, get) => ({
      focusBlocks: [],

      addFocusBlock: (id, input) => {
        validateFocusBlockInput(input);
        set((state) => ({
          focusBlocks: [
            ...state.focusBlocks,
            { ...input, id, name: input.name.trim() },
          ],
        }));
      },

      updateFocusBlock: (id, input) => {
        validateFocusBlockInput(input);
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (!existing) {
          throw new Error('Focus block not found.');
        }
        assertNotActive(existing, 'Cannot change a block while it is active.');
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id ? { ...input, id, name: input.name.trim() } : b,
          ),
        }));
      },

      toggleFocusBlock: (id, isEnabled) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (!existing) {
          throw new Error('Focus block not found.');
        }
        assertNotActive(existing, 'Cannot change a block while it is active.');
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id ? { ...b, isEnabled } : b,
          ),
        }));
      },

      deleteFocusBlock: (id) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (existing) {
          assertNotActive(
            existing,
            'Cannot delete a block while it is active.',
          );
        }
        clearSlot(selectionIdForBlock(id));
        set((state) => ({
          focusBlocks: state.focusBlocks.filter((b) => b.id !== id),
        }));
      },
    }),
    {
      name: 'focusblocks.focus-blocks',
      storage: persistedStorage,
    },
  ),
);
