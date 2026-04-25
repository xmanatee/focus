import { create } from 'zustand';
import {
  type AuthorizationStatus,
  BlockerBridge,
} from '../../bridge/BlockerBridge';

type BusyState = 'idle' | 'authorizing';

interface BlockerState {
  busyState: BusyState;
  authorizationStatus: AuthorizationStatus;
  requestPermissions: () => Promise<boolean>;
}

export const useBlockerStore = create<BlockerState>()((set) => ({
  busyState: 'idle',
  authorizationStatus: BlockerBridge.readAuthorizationStatus(),

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

BlockerBridge.subscribeToAuthorizationStatus((status) => {
  useBlockerStore.setState({ authorizationStatus: status });
});
