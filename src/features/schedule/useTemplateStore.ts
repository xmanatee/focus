import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import type { ActivitySelectionMetadata } from '../blocker/types';
import type { PresetKind } from './presets';

interface TemplateState {
  metadata: Partial<Record<PresetKind, ActivitySelectionMetadata>>;
  setMetadata: (kind: PresetKind, metadata: ActivitySelectionMetadata) => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      metadata: {},
      setMetadata: (kind, metadata) =>
        set((state) => ({
          metadata: {
            ...state.metadata,
            [kind]: metadata,
          },
        })),
    }),
    {
      name: 'focusblocks.templates',
      storage: persistedStorage,
    },
  ),
);
