import { create } from 'zustand';
import { BlockerBridge } from '../../bridge/BlockerBridge';

type BusyState = 'idle' | 'authorizing';

export type AuthorizationStatus =
  | 'unknown'
  | 'authorized'
  | 'denied'
  | 'notDetermined';

interface BlockerState {
  busyState: BusyState;
  authorizationStatus: AuthorizationStatus;
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useBlockerStore = create<BlockerState>()((set) => ({
  busyState: 'idle',
  authorizationStatus: 'unknown',

  initialize: async () => {
    const status = await BlockerBridge.checkAuthorizationStatus();
    set({ authorizationStatus: status });
  },

  requestPermissions: async () => {
    set({ busyState: 'authorizing' });
    try {
      const granted = await BlockerBridge.requestAuthorization();
      set({
        authorizationStatus: granted ? 'authorized' : 'denied',
      });
      return granted;
    } finally {
      set({ busyState: 'idle' });
    }
  },
}));
