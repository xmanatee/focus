import { create } from 'zustand';
import {
  type AuthorizationStatus,
  BlockerBridge,
} from '../../bridge/BlockerBridge';

type BusyState = 'idle' | 'authorizing';

interface BlockerState {
  readonly busyState: BusyState;
  readonly authorizationStatus: AuthorizationStatus;
  readonly requestPermissions: () => Promise<boolean>;
}

export const useBlockerStore = create<BlockerState>()((set) => ({
  busyState: 'idle',
  authorizationStatus: BlockerBridge.readAuthorizationStatus(),

  requestPermissions: async () => {
    set({ busyState: 'authorizing' });
    const granted = await BlockerBridge.requestAuthorization();
    set({
      authorizationStatus: granted ? 'authorized' : 'denied',
      busyState: 'idle',
    });
    return granted;
  },
}));

BlockerBridge.subscribeToAuthorizationStatus((status) => {
  useBlockerStore.setState({ authorizationStatus: status });
});
