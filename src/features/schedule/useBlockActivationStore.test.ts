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

  it('prunes local activation for blocks that no longer exist', () => {
    const store = useBlockActivationStore.getState();
    store.setBlockEnabled('block-a', true);
    store.setBlockEnabled('block-b', true);

    store.syncBlockPresence(['block-b']);

    expect(useBlockActivationStore.getState().enabledBlockIds).toEqual([
      'block-b',
    ]);
  });
});
