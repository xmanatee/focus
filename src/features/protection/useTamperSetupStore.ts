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
  passcode: { kind: 'unset' },
  deleteLock: { kind: 'unset' },
  installLock: { kind: 'unset' },
  completedAt: null,
};

function recompute(setup: TamperSetup, now: number): TamperSetup {
  const allSet = DEFENSE_IDS.every((id) => setup[id].kind === 'set');
  const completedAt = allSet ? setup.completedAt ?? now : null;
  return { ...setup, completedAt };
}

export const useTamperSetupStore = create<TamperSetupState>()(
  persist(
    (set) => ({
      setup: EMPTY_SETUP,

      toggle: (id) => {
        set((state) => {
          const now = Date.now();
          const nextAck: Ack =
            state.setup[id].kind === 'set'
              ? { kind: 'unset' }
              : { kind: 'set', at: now };
          return {
            setup: recompute({ ...state.setup, [id]: nextAck }, now),
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
