import { beforeEach, describe, expect, it } from 'vitest';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useSetupBlockDeviceStore } from './setupBlockDeviceStore';

function reset(): void {
  storageMap.clear();
  useSetupBlockDeviceStore.setState({
    hasResolvedInitialState: false,
    initialDeviceActivation: null,
    isEnabledOnDevice: false,
  });
}

describe('useSetupBlockDeviceStore', () => {
  beforeEach(reset);

  it('boots legacy local setups into an enabled device state once', () => {
    useSetupBlockDeviceStore.getState().initialize(true);
    useSetupBlockDeviceStore.getState().syncSetupBlockPresence(true);

    expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(true);
    expect(useSetupBlockDeviceStore.getState().hasResolvedInitialState).toBe(
      true,
    );
  });

  it('keeps synced setup blocks off on devices without prior local setup', () => {
    useSetupBlockDeviceStore.getState().initialize(false);
    useSetupBlockDeviceStore.getState().syncSetupBlockPresence(true);

    expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(false);
    expect(useSetupBlockDeviceStore.getState().hasResolvedInitialState).toBe(
      true,
    );
  });

  it('does not re-enable automatically after a setup block is removed', () => {
    const store = useSetupBlockDeviceStore.getState();
    store.initialize(true);
    store.syncSetupBlockPresence(true);
    store.syncSetupBlockPresence(false);
    store.syncSetupBlockPresence(true);

    expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(false);
  });
});
