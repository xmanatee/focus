export type DefenseId = 'screenTimeLock' | 'appDeletion';

export type Ack =
  | { readonly kind: 'unset' }
  | { readonly kind: 'set'; readonly at: number };

export interface TamperSetup {
  readonly acks: Readonly<Record<DefenseId, Ack>>;
}

export interface Defense {
  readonly id: DefenseId;
  readonly ok: boolean;
}

export interface ProtectionPosture {
  readonly defenses: readonly Defense[];
  readonly score: 'none' | 'partial' | 'full';
  readonly completedAt: number | null;
}

export const DEFENSE_IDS: readonly DefenseId[] = [
  'screenTimeLock',
  'appDeletion',
];
