import { beforeEach, describe, expect, it } from 'vitest';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useBlockActivationStore } from './useBlockActivationStore';

function reset(): void {
  storageMap.clear();
  useBlockActivationStore.setState({ enabledBlockIds: [] });
}

describe('useBlockActivationStore', () => {
  beforeEach(reset);

  it('keeps block activation local and independent from synced definitions', () => {
    const store = useBlockActivationStore.getState();

    store.setBlockEnabled('block-a', true);
    store.setBlockEnabled('block-b', true);
    store.setBlockEnabled('block-a', false);

    expect(useBlockActivationStore.getState().enabledBlockIds).toEqual([
      'block-b',
    ]);
  });

  it('retains activation only for blocks that remain ready here', () => {
    const store = useBlockActivationStore.getState();
    store.setBlockEnabled('block-a', true);
    store.setBlockEnabled('block-b', true);

    store.retainEnabledBlocks(['block-b']);

    expect(useBlockActivationStore.getState().enabledBlockIds).toEqual([
      'block-b',
    ]);
  });

  it('rejects an empty block id', () => {
    expect(() =>
      useBlockActivationStore.getState().setBlockEnabled(' ', true),
    ).toThrow(/id is required/i);
  });
});
