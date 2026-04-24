import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BlockerBridge } from '../../bridge/BlockerBridge';
import { persistedStorage } from '../../shared/storage';

type BusyState = 'idle' | 'authorizing';

type AuthorizationStatus =
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

export const useBlockerStore = create<BlockerState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'focusblocks.blocker',
      storage: persistedStorage,
    },
  ),
);
