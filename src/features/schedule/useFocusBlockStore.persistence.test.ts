import { beforeEach, describe, expect, it, vi } from 'vitest';
import { focusBlockInput } from '../../test-helpers/focusBlockFixtures';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useFocusBlockStore } from './useFocusBlockStore';

function focusBlockStorageKey(): string {
  const name = useFocusBlockStore.persist.getOptions().name;
  if (name === undefined) {
    throw new Error('Focus block storage key is missing.');
  }
  return name;
}

function persistedBlock() {
  return {
    ...focusBlockInput(),
    id: 'stored-block',
    name: 'Stored block',
  };
}

describe('useFocusBlockStore persistence', () => {
  beforeEach(() => {
    storageMap.clear();
    useFocusBlockStore.setState({ focusBlocks: [] });
  });

  it('hydrates when no focus blocks have been stored yet', async () => {
    await useFocusBlockStore.persist.rehydrate();

    expect(useFocusBlockStore.persist.hasHydrated()).toBe(true);
    expect(useFocusBlockStore.getState().focusBlocks).toEqual([]);
  });

  it('hydrates current explicit focus block data', async () => {
    storageMap.set(
      focusBlockStorageKey(),
      JSON.stringify({
        state: { focusBlocks: [persistedBlock()] },
        version: 2,
      }),
    );

    await useFocusBlockStore.persist.rehydrate();

    expect(useFocusBlockStore.persist.hasHydrated()).toBe(true);
    expect(useFocusBlockStore.getState().focusBlocks).toEqual([
      persistedBlock(),
    ]);
  });

  it('rejects persisted blocks without an explicit rule', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { rule: _rule, ...withoutRule } = persistedBlock();
    storageMap.set(
      focusBlockStorageKey(),
      JSON.stringify({
        state: { focusBlocks: [withoutRule] },
        version: 2,
      }),
    );

    try {
      await useFocusBlockStore.persist.rehydrate();
      expect(useFocusBlockStore.persist.hasHydrated()).toBe(false);
      expect(useFocusBlockStore.getState().focusBlocks).toEqual([]);
    } finally {
      consoleError.mockRestore();
    }
  });
});
