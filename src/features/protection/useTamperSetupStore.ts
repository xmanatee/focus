import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import {
  type Ack,
  DEFENSE_IDS,
  type DefenseId,
  type TamperSetup,
} from './types';

interface TamperSetupState {
  setup: TamperSetup;
  toggle: (id: DefenseId) => void;
}

const EMPTY_SETUP: TamperSetup = {
  acks: Object.fromEntries(
    DEFENSE_IDS.map((id) => [id, { kind: 'unset' }] as const),
  ) as Record<DefenseId, Ack>,
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
      name: 'focusblocks.protection.tamper-setup',
      storage: persistedStorage,
    },
  ),
);
