import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import type { Ack, DefenseId, TamperSetup } from './types';

interface TamperSetupState {
  setup: TamperSetup;
  toggle: (id: DefenseId) => void;
}

const EMPTY_SETUP: TamperSetup = {
  acks: {
    screenTimeLock: { kind: 'unset' },
    appDeletion: { kind: 'unset' },
  },
};

export const useTamperSetupStore = create<TamperSetupState>()(
  persist(
    (set) => ({
      setup: EMPTY_SETUP,

      toggle: (id) => {
        set((state) => {
          const current = state.setup.acks[id];
          const next: Ack =
            current.kind === 'set'
              ? { kind: 'unset' }
              : { kind: 'set', at: Date.now() };
          return {
            setup: { acks: { ...state.setup.acks, [id]: next } },
          };
        });
      },
    }),
    {
      // v2 schema: `{ acks: Record<DefenseId, Ack> }`. Renaming the key
      // strands any v1 (`{ passcode, deleteLock, installLock, completedAt }`)
      // payloads in iCloud rather than carrying a translation shim.
      name: 'focusblocks.protection.tamper-setup.v2',
      storage: persistedStorage,
    },
  ),
);
