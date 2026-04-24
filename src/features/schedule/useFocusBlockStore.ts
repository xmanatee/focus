import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId, persistedStorage } from '../../shared/storage';
import { EMPTY_BLOCK_SELECTION } from '../blocker/types';
import { isFocusBlockActiveAt } from './activeness';
import type { FocusBlock, FocusBlockInput } from './types';

interface FocusBlockState {
  focusBlocks: FocusBlock[];
  addFocusBlock: (input: FocusBlockInput) => void;
  updateFocusBlock: (id: string, input: FocusBlockInput) => void;
  toggleFocusBlock: (id: string, isEnabled: boolean) => void;
  deleteFocusBlock: (id: string) => void;
  addPreset: (preset: 'deep-work' | 'evening' | 'weekend') => void;
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

      addFocusBlock: (input) =>
        set((state) => ({
          focusBlocks: [
            ...state.focusBlocks,
            {
              id: newId(),
              name: input.name.trim(),
              startTime: input.startTime,
              endTime: input.endTime,
              days: input.days,
              isEnabled: input.isEnabled,
              selection: input.selection,
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
          assertNotActive(existing, 'Cannot delete a block while it is active.');
        }
        set((state) => ({
          focusBlocks: state.focusBlocks.filter((b) => b.id !== id),
        }));
      },

      addPreset: (kind) => {
        const presets: Record<string, FocusBlockInput> = {
          'deep-work': {
            name: 'Deep Work',
            startTime: '09:00',
            endTime: '12:00',
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            isEnabled: true,
            selection: {
              ...EMPTY_BLOCK_SELECTION,
              webDomains: [
                'instagram.com',
                'facebook.com',
                'twitter.com',
                'x.com',
                'tiktok.com',
                'youtube.com',
                'reddit.com',
                'twitch.tv',
                'netflix.com',
                'hulu.com',
              ],
            },
          },
          evening: {
            name: 'Evening Wind-down',
            startTime: '21:00',
            endTime: '23:30',
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            isEnabled: true,
            selection: {
              ...EMPTY_BLOCK_SELECTION,
              webDomains: [
                'youtube.com',
                'netflix.com',
                'tiktok.com',
                'twitch.tv',
                'hulu.com',
                'disneyplus.com',
                'primevideo.com',
                'instagram.com',
              ],
            },
          },
          weekend: {
            name: 'Digital Detox',
            startTime: '08:00',
            endTime: '20:00',
            days: ['sat', 'sun'],
            isEnabled: true,
            selection: {
              ...EMPTY_BLOCK_SELECTION,
              webDomains: [
                'instagram.com',
                'tiktok.com',
                'facebook.com',
                'reddit.com',
                'twitter.com',
                'x.com',
                'youtube.com',
                'twitch.tv',
              ],
            },
          },
        };

        const input = presets[kind];
        if (input) {
          get().addFocusBlock(input);
        }
      },
    }),
    {
      name: 'fucus.focus-blocks',
      storage: persistedStorage,
    },
  ),
);
