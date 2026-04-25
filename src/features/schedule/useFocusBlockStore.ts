import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { clearSelectionSlot } from '../blocker/selectionSlot';
import { isFocusBlockActiveAt } from './activeness';
import type { FocusBlock, FocusBlockInput } from './types';

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

      addFocusBlock: (id, input) =>
        set((state) => ({
          focusBlocks: [
            ...state.focusBlocks,
            {
              id,
              name: input.name.trim(),
              startTime: input.startTime,
              endTime: input.endTime,
              days: input.days,
              isEnabled: input.isEnabled,
              selection: input.selection,
              notifyOnStart: input.notifyOnStart,
              notifyOnEnd: input.notifyOnEnd,
            },
          ],
        })),

      updateFocusBlock: (id, input) => {
        const existing = get().focusBlocks.find((b) => b.id === id);
        if (!existing) {
          throw new Error('Focus block not found.');
        }
        assertNotActive(existing, 'Cannot change a block while it is active.');
        set((state) => ({
          focusBlocks: state.focusBlocks.map((b) =>
            b.id === id
              ? {
                  ...b,
                  name: input.name.trim(),
                  startTime: input.startTime,
                  endTime: input.endTime,
                  days: input.days,
                  selection: input.selection,
                  notifyOnStart: input.notifyOnStart,
                  notifyOnEnd: input.notifyOnEnd,
                }
              : b,
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
        clearSelectionSlot(id);
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
