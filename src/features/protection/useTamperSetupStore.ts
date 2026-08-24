import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { localStorage } from '../../shared/storage';
import { isRecord } from '../../shared/validation';
import { TAMPER_SETUP_STORAGE_KEY } from '../settings/storageKeys';
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

function parseAck(value: unknown): Ack {
  if (!isRecord(value)) {
    throw new Error('Stored protection confirmation is invalid.');
  }
  const ack = value as Partial<Ack>;
  if (ack.kind === 'unset') return { kind: 'unset' };
  if (
    ack.kind === 'set' &&
    typeof ack.at === 'number' &&
    Number.isFinite(ack.at) &&
    ack.at > 0
  ) {
    return { kind: 'set', at: ack.at };
  }
  throw new Error('Stored protection confirmation is invalid.');
}

function mergePersistedSetup(
  state: unknown,
  current: TamperSetupState,
): TamperSetupState {
  if (state === undefined) return current;
  if (!isRecord(state)) {
    throw new Error('Stored protection setup is invalid.');
  }
  const setup = (state as { readonly setup?: unknown }).setup;
  if (!isRecord(setup)) {
    throw new Error('Stored protection setup is invalid.');
  }
  const parsed = setup as {
    readonly hasSeenIntro?: unknown;
    readonly acks?: Record<DefenseId, unknown>;
  };
  if (
    typeof parsed.hasSeenIntro !== 'boolean' ||
    typeof parsed.acks !== 'object' ||
    parsed.acks === null
  ) {
    throw new Error('Stored protection setup is invalid.');
  }
  return {
    ...current,
    setup: {
      hasSeenIntro: parsed.hasSeenIntro,
      acks: {
        screenTimeLock: parseAck(parsed.acks.screenTimeLock),
        appDeletion: parseAck(parsed.acks.appDeletion),
      },
    },
  };
}

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
      name: TAMPER_SETUP_STORAGE_KEY,
      storage: localStorage,
      skipHydration: true,
      merge: mergePersistedSetup,
    },
  ),
);
