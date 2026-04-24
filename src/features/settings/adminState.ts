import { isScheduleActiveAt, nextStartAfter } from '../schedule/activeness';
import type { DayOfWeek } from '../schedule/types';

export interface SetupWindow {
  readonly days: readonly DayOfWeek[];
  readonly startTime: string;
  readonly endTime: string;
}

export type AdminState =
  | { readonly kind: 'unlocked'; readonly reason: 'always' | 'inside-window' }
  | {
      readonly kind: 'locked';
      readonly nextUnlock: {
        readonly at: Date;
        readonly day: DayOfWeek;
      } | null;
    };

export function resolveAdminState(
  setupWindow: SetupWindow | null,
  now: Date,
): AdminState {
  if (!setupWindow) {
    return { kind: 'unlocked', reason: 'always' };
  }

  const asScheduleWindow = { ...setupWindow, isEnabled: true };

  if (isScheduleActiveAt(asScheduleWindow, now)) {
    return { kind: 'unlocked', reason: 'inside-window' };
  }

  const next = nextStartAfter(asScheduleWindow, now);
  return {
    kind: 'locked',
    nextUnlock: next,
  };
}
