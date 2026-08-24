import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorage } from '../../shared/storage';
import { isRecord } from '../../shared/validation';
import { BLOCK_ACTIVATION_STORAGE_KEY } from '../settings/storageKeys';

interface BlockActivationState {
  readonly enabledBlockIds: readonly string[];
  readonly isBlockEnabled: (blockId: string) => boolean;
  readonly setBlockEnabled: (blockId: string, isEnabled: boolean) => void;
  readonly retainEnabledBlocks: (readyBlockIds: readonly string[]) => void;
}

function withoutBlockId(
  blockIds: readonly string[],
  blockId: string,
): string[] {
  return blockIds.filter((id) => id !== blockId);
}

function mergePersistedActivation(
  state: unknown,
  current: BlockActivationState,
): BlockActivationState {
  if (state === undefined) return current;
  if (!isRecord(state) || !Array.isArray(state.enabledBlockIds)) {
    throw new Error('Stored block activation is invalid.');
  }
  const enabledBlockIds = state.enabledBlockIds;
  if (
    enabledBlockIds.some(
      (id) => typeof id !== 'string' || id.trim().length === 0,
    ) ||
    new Set(enabledBlockIds).size !== enabledBlockIds.length
  ) {
    throw new Error('Stored enabled block ids are invalid.');
  }
  return { ...current, enabledBlockIds: enabledBlockIds as string[] };
}

export const useBlockActivationStore = create<BlockActivationState>()(
  persist(
    (set, get) => ({
      enabledBlockIds: [],

      isBlockEnabled: (blockId) => get().enabledBlockIds.includes(blockId),

      setBlockEnabled: (blockId, isEnabled) => {
        if (blockId.trim().length === 0) {
          throw new Error('Focus block id is required.');
        }
        set((state) => {
          if (state.enabledBlockIds.includes(blockId) === isEnabled) {
            return state;
          }
          const enabledBlockIds = withoutBlockId(
            state.enabledBlockIds,
            blockId,
          );
          return {
            enabledBlockIds: isEnabled
              ? [...enabledBlockIds, blockId]
              : enabledBlockIds,
          };
        });
      },

      retainEnabledBlocks: (readyBlockIds) =>
        set((state) => {
          const ready = new Set(readyBlockIds);
          const enabledBlockIds = state.enabledBlockIds.filter((id) =>
            ready.has(id),
          );
          if (enabledBlockIds.length === state.enabledBlockIds.length) {
            return state;
          }
          return {
            enabledBlockIds,
          };
        }),
    }),
    {
      name: BLOCK_ACTIVATION_STORAGE_KEY,
      storage: localStorage,
      skipHydration: true,
      merge: mergePersistedActivation,
    },
  ),
);
