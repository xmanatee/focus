import { isFocusBlockActiveAt, nextStartAfter } from '../schedule/activeness';
import type { DayOfWeek } from '../schedule/types';

export interface SetupBlock {
  readonly days: readonly DayOfWeek[];
  readonly startTime: string;
  readonly endTime: string;
  readonly notifyOnStart: boolean;
}

export type AdminState =
  | { readonly kind: 'unlocked'; readonly reason: 'always' | 'inside-block' }
  | {
      readonly kind: 'locked';
      readonly nextUnlock: {
        readonly at: Date;
        readonly day: DayOfWeek;
      } | null;
    };

export function resolveAdminState(
  setupBlock: SetupBlock | null,
  now: Date,
): AdminState {
  if (!setupBlock) {
    return { kind: 'unlocked', reason: 'always' };
  }

  const asFocusBlock = { ...setupBlock, isEnabled: true };

  if (isFocusBlockActiveAt(asFocusBlock, now)) {
    return { kind: 'unlocked', reason: 'inside-block' };
  }

  const next = nextStartAfter(asFocusBlock, now);
  return {
    kind: 'locked',
    nextUnlock: next,
  };
}

export function assertAdminUnlocked(
  setupBlock: SetupBlock | null,
  now: Date,
): void {
  if (resolveAdminState(setupBlock, now).kind === 'locked') {
    throw new Error(
      'Lock-in is active. Edits unlock during your setup window.',
    );
  }
}
