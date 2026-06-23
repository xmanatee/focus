import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBlockerStore } from './useBlockerStore';

const nativeAuthorization = vi.hoisted(() => ({
  approveOnRequest: true,
  polledStatus: 1,
  status: 0,
  throwsOnRequest: false,
}));

vi.mock('react-native-device-activity', () => ({
  AuthorizationStatus: {
    approved: 1,
    denied: 2,
  },
  getAuthorizationStatus: () => nativeAuthorization.status,
  onAuthorizationStatusChange: () => ({ remove: vi.fn() }),
  pollAuthorizationStatus: async () => nativeAuthorization.polledStatus,
  requestAuthorization: async () => {
    if (nativeAuthorization.throwsOnRequest) {
      throw new Error('Native authorization failed.');
    }
    if (nativeAuthorization.approveOnRequest) nativeAuthorization.status = 1;
  },
}));

describe('useBlockerStore', () => {
  beforeEach(() => {
    nativeAuthorization.approveOnRequest = true;
    nativeAuthorization.polledStatus = 1;
    nativeAuthorization.status = 0;
    nativeAuthorization.throwsOnRequest = false;
    useBlockerStore.setState({
      authorizationStatus: 'notDetermined',
      busyState: 'idle',
    });
  });

  it('refreshes Screen Time authorization from native state', () => {
    nativeAuthorization.status = 1;

    useBlockerStore.getState().refreshAuthorizationStatus();

    expect(useBlockerStore.getState().authorizationStatus).toBe('authorized');
  });

  it('waits for delayed native authorization status after permission approval', async () => {
    nativeAuthorization.approveOnRequest = false;
    nativeAuthorization.polledStatus = 1;

    const granted = await useBlockerStore.getState().requestPermissions();

    expect(granted).toBe(true);
    expect(useBlockerStore.getState().authorizationStatus).toBe('authorized');
  });

  it('returns to idle when native authorization fails', async () => {
    nativeAuthorization.throwsOnRequest = true;

    await expect(
      useBlockerStore.getState().requestPermissions(),
    ).rejects.toThrow(/failed/i);

    expect(useBlockerStore.getState().busyState).toBe('idle');
  });
});
