import { create } from 'zustand';
import { BlockerBridge } from '../../bridge/BlockerBridge';

type BusyState = 'idle' | 'authorizing';

interface BlockerState {
  busyState: BusyState;
  hasPermissions: boolean;
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
}

export const useBlockerStore = create<BlockerState>()((set) => ({
  busyState: 'idle',
  hasPermissions: false,

  initialize: async () => {
    const authorizationStatus = await BlockerBridge.checkAuthorizationStatus();
    set({ hasPermissions: authorizationStatus === 'authorized' });
  },

  requestPermissions: async () => {
    set({ busyState: 'authorizing' });
    try {
      const hasPermissions = await BlockerBridge.requestAuthorization();
      set({ hasPermissions });
      return hasPermissions;
    } finally {
      set({ busyState: 'idle' });
    }
  },
}));
