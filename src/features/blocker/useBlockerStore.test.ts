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
      authorization: {
        setupStep: 'authorizationSettings',
        status: 'notDetermined',
      },
      busyState: 'idle',
    });
  });

  it('waits for delayed native authorization status after permission approval', async () => {
    nativeAuthorization.approveOnRequest = false;
    nativeAuthorization.polledStatus = 1;

    const granted = await useBlockerStore.getState().requestPermissions();

    expect(granted).toBe(true);
    expect(useBlockerStore.getState().authorization.status).toBe('authorized');
  });

  it('reports native authorization failure and returns to idle', async () => {
    nativeAuthorization.throwsOnRequest = true;

    const granted = await useBlockerStore.getState().requestPermissions();

    expect(granted).toBe(false);
    expect(useBlockerStore.getState().busyState).toBe('idle');
  });
});
