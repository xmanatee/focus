import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import {
  EMERGENCY_INITIAL_LENGTH,
  generateCode,
  nextCodeLength,
} from './codeChallenge';
import { resolveEmergencyQuota } from './quota';
import type { EmergencyMode, EnabledWeeklyLimit, WeeklyLimit } from './types';

type ConsumeResult =
  | { readonly ok: true; readonly nextCode: string }
  | { readonly ok: false; readonly reason: 'wrong-code' | 'not-ready' };

interface ConfigureInput {
  readonly weeklyLimit: WeeklyLimit;
  readonly cooldownMinutes: number;
}

interface EmergencyStoreState {
  mode: EmergencyMode;
  configure: (input: ConfigureInput) => void;
  consume: (plaintext: string, now: Date) => ConsumeResult;
}

const DISABLED: EmergencyMode = { kind: 'disabled' };

function buildEnabled(
  weeklyLimit: EnabledWeeklyLimit,
  cooldownMinutes: number,
): EmergencyMode {
  return {
    kind: 'enabled',
    weeklyLimit,
    cooldownMinutes,
    codeLength: EMERGENCY_INITIAL_LENGTH,
    currentCode: generateCode(EMERGENCY_INITIAL_LENGTH),
    history: [],
  };
}

export const useEmergencyStore = create<EmergencyStoreState>()(
  persist(
    (set, get) => ({
      mode: DISABLED,

      configure: ({ weeklyLimit, cooldownMinutes }) => {
        if (weeklyLimit === 0) {
          set({ mode: DISABLED });
          return;
        }
        const current = get().mode;
        if (current.kind === 'enabled') {
          set({
            mode: { ...current, weeklyLimit, cooldownMinutes },
          });
          return;
        }
        set({ mode: buildEnabled(weeklyLimit, cooldownMinutes) });
      },

      consume: (plaintext, now) => {
        const mode = get().mode;
        if (mode.kind === 'disabled') {
          return { ok: false, reason: 'not-ready' };
        }
        if (resolveEmergencyQuota(mode, now).kind !== 'ready') {
          return { ok: false, reason: 'not-ready' };
        }
        if (plaintext !== mode.currentCode) {
          return { ok: false, reason: 'wrong-code' };
        }
        const newLength = nextCodeLength(mode.codeLength);
        const nextCode = generateCode(newLength);
        set({
          mode: {
            ...mode,
            codeLength: newLength,
            currentCode: nextCode,
            history: [...mode.history, { usedAt: now.getTime() }],
          },
        });
        return { ok: true, nextCode };
      },
    }),
    {
      name: 'focusblocks.protection.emergency',
      storage: persistedStorage,
    },
  ),
);
