import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import type { Ack, DefenseId, TamperSetup } from './types';

interface TamperSetupState {
  readonly markIntroSeen: () => void;
  readonly setup: TamperSetup;
  readonly toggle: (id: DefenseId) => void;
}

const EMPTY_SETUP: TamperSetup = {
  hasSeenIntro: false,
  acks: {
    screenTimeLock: { kind: 'unset' },
    appDeletion: { kind: 'unset' },
  },
};

export const useTamperSetupStore = create<TamperSetupState>()(
  persist(
    (set) => ({
      setup: EMPTY_SETUP,

      markIntroSeen: () => {
        set((state) => ({
          setup: {
            ...state.setup,
            hasSeenIntro: true,
          },
        }));
      },

      toggle: (id) => {
        set((state) => {
          const current = state.setup.acks[id];
          const next: Ack =
            current.kind === 'set'
              ? { kind: 'unset' }
              : { kind: 'set', at: Date.now() };
          return {
            setup: {
              ...state.setup,
              acks: { ...state.setup.acks, [id]: next },
            },
          };
        });
      },
    }),
    {
      name: 'focusblocks.protection.tamper-setup.v2',
      storage: persistedStorage,
    },
  ),
);
