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

export const DEFAULT_SESSION_DURATION_SEC = 25 * 60;

interface BlockerState {
  busyState: BusyState;
  isActive: boolean;
  hasPermissions: boolean;
  selection: BlockSelection;
  sessionStartedAt: number | null;
  sessionDurationSec: number;
  initialize: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  setSessionDuration: (durationSec: number) => void;
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
  sessionDurationSec: number;
}

function dedupeDomains(domains: string[]): string[] {
  return [...new Set(domains)];
}

function parsePersistedBlockerState(
  persistedState: unknown,
): PersistedBlockerState | null {
  if (typeof persistedState !== 'object' || persistedState === null) {
    return null;
  }

  const state = persistedState as {
    selection?: unknown;
    sessionDurationSec?: unknown;
  };

  if (typeof state.selection !== 'object' || state.selection === null) {
    return null;
  }

  const { webDomains } = state.selection as { webDomains?: unknown };
  if (
    !Array.isArray(webDomains) ||
    webDomains.some((d) => typeof d !== 'string')
  ) {
    return null;
  }

  const sessionDurationSec =
    typeof state.sessionDurationSec === 'number' && state.sessionDurationSec > 0
      ? state.sessionDurationSec
      : DEFAULT_SESSION_DURATION_SEC;

  return {
    selection: { webDomains: dedupeDomains(webDomains) },
    sessionDurationSec,
  };
}

export const useBlockerStore = create<BlockerState>()(
  persist(
    (set, get) => {
      const syncSelectionIfActive = async (
        selection: BlockSelection,
      ): Promise<void> => {
        if (!get().isActive) {
          return;
        }

        const nextIsActive = selectionHasBlockedTargets(selection);
        set({ busyState: 'syncing' });
        try {
          await BlockerBridge.syncState({ isActive: nextIsActive, selection });
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
        sessionStartedAt: null,
        sessionDurationSec: DEFAULT_SESSION_DURATION_SEC,

        initialize: async () => {
          const authorizationStatus =
            await BlockerBridge.checkAuthorizationStatus();
          const activitySelection = BlockerBridge.getActivitySelection();
          const isActive = BlockerBridge.isBlockerActive();

          set((state) => ({
            hasPermissions: authorizationStatus === 'authorized',
            isActive,
            selection: { ...state.selection, activitySelection },
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

        setSessionDuration: (durationSec) => {
          if (durationSec <= 0) {
            throw new Error('Session duration must be positive.');
          }
          set({ sessionDurationSec: durationSec });
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
            webDomains: get().selection.webDomains.filter((d) => d !== domain),
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
            set({
              isActive: nextIsActive,
              sessionStartedAt: nextIsActive ? Date.now() : null,
            });
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
        sessionDurationSec: state.sessionDurationSec,
      }),
      merge: (persistedState, currentState) => {
        const persisted = parsePersistedBlockerState(persistedState);
        if (persisted === null) {
          return currentState;
        }
        return {
          ...currentState,
          selection: {
            ...currentState.selection,
            webDomains: persisted.selection.webDomains,
          },
          sessionDurationSec: persisted.sessionDurationSec,
        };
      },
    },
  ),
);
