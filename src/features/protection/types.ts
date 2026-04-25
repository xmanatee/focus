export type DefenseId = 'passcode' | 'deleteLock' | 'installLock';

export type Ack =
  | { readonly kind: 'unset' }
  | { readonly kind: 'set'; readonly at: number };

export interface TamperSetup {
  readonly passcode: Ack;
  readonly deleteLock: Ack;
  readonly installLock: Ack;
  readonly completedAt: number | null;
}

export type WeeklyLimit = 0 | 1 | 2 | 3;
export type EnabledWeeklyLimit = Exclude<WeeklyLimit, 0>;

export type EmergencyMode =
  | { readonly kind: 'disabled' }
  | {
      readonly kind: 'enabled';
      readonly weeklyLimit: EnabledWeeklyLimit;
      readonly cooldownMinutes: number;
      readonly codeLength: number;
      readonly currentCode: string;
      readonly history: readonly { readonly usedAt: number }[];
    };

export type EmergencyQuota =
  | { readonly kind: 'disabled' }
  | { readonly kind: 'exhausted'; readonly resetsAt: Date }
  | { readonly kind: 'cooldown'; readonly unlocksAt: Date }
  | {
      readonly kind: 'ready';
      readonly remainingThisWeek: number;
      readonly codeLength: number;
    };

export interface Defense {
  readonly id: DefenseId;
  readonly ok: boolean;
}

export interface ProtectionPosture {
  readonly defenses: readonly Defense[];
  readonly score: 'none' | 'partial' | 'full';
}

export const DEFENSE_IDS: readonly DefenseId[] = [
  'passcode',
  'deleteLock',
  'installLock',
];
