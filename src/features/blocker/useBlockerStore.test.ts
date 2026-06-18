import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBlockerStore } from './useBlockerStore';

const nativeAuthorization = vi.hoisted(() => ({
  status: 0,
}));

vi.mock('react-native-device-activity', () => ({
  AuthorizationStatus: {
    approved: 1,
    denied: 2,
  },
  getAuthorizationStatus: () => nativeAuthorization.status,
  onAuthorizationStatusChange: () => ({ remove: vi.fn() }),
  requestAuthorization: async () => {
    nativeAuthorization.status = 1;
  },
}));

describe('useBlockerStore', () => {
  beforeEach(() => {
    nativeAuthorization.status = 0;
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
});
