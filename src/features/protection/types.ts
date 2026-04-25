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
