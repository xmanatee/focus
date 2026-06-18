import { beforeEach, describe, expect, it } from 'vitest';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useSetupBlockDeviceStore } from './setupBlockDeviceStore';

function reset(): void {
  storageMap.clear();
  useSetupBlockDeviceStore.setState({
    isEnabledOnDevice: false,
  });
}

describe('useSetupBlockDeviceStore', () => {
  beforeEach(reset);

  it('keeps synced setup blocks off until explicit device enablement', () => {
    useSetupBlockDeviceStore.getState().syncSetupBlockPresence(true);

    expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(false);
  });

  it('preserves explicit device enablement while setup block exists', () => {
    useSetupBlockDeviceStore.getState().enableOnDevice();
    useSetupBlockDeviceStore.getState().syncSetupBlockPresence(true);

    expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(true);
  });

  it('turns off on this device when the setup block is removed', () => {
    const store = useSetupBlockDeviceStore.getState();
    store.enableOnDevice();

    store.syncSetupBlockPresence(true);
    store.syncSetupBlockPresence(false);

    expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(false);
  });
});
