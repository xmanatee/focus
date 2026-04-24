import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BlockerBridge } from '../../bridge/BlockerBridge';
import { parseBlockedDomain } from './domain';
import {
  type BlockSelection,
  EMPTY_BLOCK_SELECTION,
  type PersistedActivitySelection,
  selectionHasBlockedTargets,
} from './types';

type BusyState = 'idle' | 'authorizing' | 'syncing';

interface BlockerState {
  busyState: BusyState;
  isActive: boolean;
  hasPermissions: boolean;
  selection: BlockSelection;
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  setActivitySelection: (
    activitySelection: PersistedActivitySelection,
  ) => Promise<void>;
  addWebDomain: (input: string) => Promise<void>;
  removeWebDomain: (domain: string) => Promise<void>;
  setBlockerEnabled: (nextIsActive: boolean) => Promise<void>;
}

interface PersistedBlockerState {
  selection: {
    webDomains: string[];
  };
}

function dedupeDomains(domains: string[]) {
  return [...new Set(domains)];
}

function parsePersistedBlockerState(
  persistedState: unknown,
): PersistedBlockerState | null {
  if (typeof persistedState !== 'object' || persistedState === null) {
    return null;
  }

  const { selection } = persistedState as {
    selection?: unknown;
  };

  if (typeof selection !== 'object' || selection === null) {
    return null;
  }

  const { webDomains } = selection as {
    webDomains?: unknown;
  };

  if (!Array.isArray(webDomains)) {
    return null;
  }

  if (webDomains.some((domain) => typeof domain !== 'string')) {
    return null;
  }

  return {
    selection: {
      webDomains: dedupeDomains(webDomains),
    },
  };
}

export const useBlockerStore = create<BlockerState>()(
  persist(
    (set, get) => {
      const syncSelectionIfActive = async (selection: BlockSelection) => {
        if (!get().isActive) {
          return;
        }

        const nextIsActive = selectionHasBlockedTargets(selection);
        set({ busyState: 'syncing' });
        try {
          await BlockerBridge.syncState({
            isActive: nextIsActive,
            selection,
          });
          set({ isActive: nextIsActive });
        } finally {
          set({ busyState: 'idle' });
        }
      };

      return {
        busyState: 'idle',
        isActive: false,
        hasPermissions: false,
        selection: EMPTY_BLOCK_SELECTION,

        initialize: async () => {
          const authorizationStatus =
            await BlockerBridge.checkAuthorizationStatus();
          const activitySelection = BlockerBridge.getActivitySelection();
          const isActive = BlockerBridge.isBlockerActive();

          set((state) => ({
            hasPermissions: authorizationStatus === 'authorized',
            isActive,
            selection: {
              ...state.selection,
              activitySelection,
            },
          }));
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

        setActivitySelection: async (activitySelection) => {
          const nextSelection = {
            ...get().selection,
            activitySelection,
          };

          set({ selection: nextSelection });
          await syncSelectionIfActive(nextSelection);
        },

        addWebDomain: async (input) => {
          const domain = parseBlockedDomain(input);
          if (domain === null) {
            throw new Error('Enter a valid domain like example.com.');
          }

          const nextSelection = {
            ...get().selection,
            webDomains: dedupeDomains([...get().selection.webDomains, domain]),
          };

          set({ selection: nextSelection });
          await syncSelectionIfActive(nextSelection);
        },

        removeWebDomain: async (domain) => {
          const nextSelection = {
            ...get().selection,
            webDomains: get().selection.webDomains.filter(
              (currentDomain) => currentDomain !== domain,
            ),
          };

          set({ selection: nextSelection });
          await syncSelectionIfActive(nextSelection);
        },

        setBlockerEnabled: async (nextIsActive) => {
          if (nextIsActive && !get().hasPermissions) {
            throw new Error('Screen Time permission is required.');
          }

          const selection = get().selection;
          if (nextIsActive && !selectionHasBlockedTargets(selection)) {
            throw new Error('Pick at least one app or blocked website first.');
          }

          set({ busyState: 'syncing' });
          try {
            await BlockerBridge.syncState({
              isActive: nextIsActive,
              selection,
            });
            set({ isActive: nextIsActive });
          } finally {
            set({ busyState: 'idle' });
          }
        },
      };
    },
    {
      name: 'fucus.blocker',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selection: {
          webDomains: state.selection.webDomains,
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = parsePersistedBlockerState(persistedState);
        return {
          ...currentState,
          selection: {
            ...currentState.selection,
            webDomains:
              persisted === null
                ? currentState.selection.webDomains
                : persisted.selection.webDomains,
          },
        };
      },
    },
  ),
);
