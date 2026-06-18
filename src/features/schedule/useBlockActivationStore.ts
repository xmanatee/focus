import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorage } from '../../shared/storage';
import { BLOCK_ACTIVATION_STORAGE_KEY } from '../settings/storageKeys';

interface BlockActivationState {
  readonly enabledBlockIds: readonly string[];
  readonly isBlockEnabled: (blockId: string) => boolean;
  readonly setBlockEnabled: (blockId: string, isEnabled: boolean) => void;
  readonly syncBlockPresence: (blockIds: readonly string[]) => void;
}

function withoutBlockId(
  blockIds: readonly string[],
  blockId: string,
): string[] {
  return blockIds.filter((id) => id !== blockId);
}

export const useBlockActivationStore = create<BlockActivationState>()(
  persist(
    (set, get) => ({
      enabledBlockIds: [],

      isBlockEnabled: (blockId) => get().enabledBlockIds.includes(blockId),

      setBlockEnabled: (blockId, isEnabled) =>
        set((state) => {
          const enabledBlockIds = withoutBlockId(
            state.enabledBlockIds,
            blockId,
          );
          return {
            enabledBlockIds: isEnabled
              ? [...enabledBlockIds, blockId]
              : enabledBlockIds,
          };
        }),

      syncBlockPresence: (blockIds) =>
        set((state) => {
          const existing = new Set(blockIds);
          return {
            enabledBlockIds: state.enabledBlockIds.filter((id) =>
              existing.has(id),
            ),
          };
        }),
    }),
    {
      name: BLOCK_ACTIVATION_STORAGE_KEY,
      storage: localStorage,
    },
  ),
);
