import { nextOccurrenceOf } from '../../shared/days';
import { isInsideScheduleWindow, nextStartAfter } from './activeness';
import {
  budgetActivityName,
  budgetEventReachedAfterIntervalStart,
  budgetMinutes,
  budgetOriginDaysAtWeeklyInstant,
} from './schedulerActions';
import type { DayOfWeek, FocusBlock } from './types';

const DAY_BY_DATE_INDEX: readonly DayOfWeek[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

export type ActiveReason = 'scheduled' | 'outsideSchedule' | 'budget';

export type FocusBlockRuntimeStatus =
  | { readonly kind: 'inactive' }
  | {
      readonly kind: 'active';
      readonly block: FocusBlock;
      readonly reason: ActiveReason;
      readonly endsAt: Date;
    };

function minuteOfDay(at: Date): number {
  return at.getHours() * 60 + at.getMinutes();
}

function nextMidnight(after: Date): Date {
  const at = new Date(after);
  at.setDate(at.getDate() + 1);
  at.setHours(0, 0, 0, 0);
  return at;
}

function isBudgetExceededAt(block: FocusBlock, at: Date): boolean {
  if (!block.isEnabled || budgetMinutes(block) === null) return false;

  const day = DAY_BY_DATE_INDEX[at.getDay()];
  const minute = minuteOfDay(at);
  return budgetOriginDaysAtWeeklyInstant(block, day, minute).some((originDay) =>
    budgetEventReachedAfterIntervalStart(budgetActivityName(block, originDay)),
  );
}

export function getFocusBlockRuntimeStatus(
  block: FocusBlock,
  at: Date,
): FocusBlockRuntimeStatus {
  if (!block.isEnabled) return { kind: 'inactive' };

  if (block.rule.kind === 'blockDuringSchedule') {
    const active = isInsideScheduleWindow(block, at);
    return active
      ? {
          kind: 'active',
          block,
          reason: 'scheduled',
          endsAt: nextOccurrenceOf(block.endTime, at),
        }
      : { kind: 'inactive' };
  }

  if (block.rule.kind === 'allowDuringSchedule') {
    if (!isInsideScheduleWindow(block, at)) {
      const next = nextStartAfter(block, at);
      return next === null
        ? { kind: 'inactive' }
        : {
            kind: 'active',
            block,
            reason: 'outsideSchedule',
            endsAt: next.at,
          };
    }
    return { kind: 'inactive' };
  }

  if (block.rule.kind === 'dailyBudget') {
    return isBudgetExceededAt(block, at)
      ? { kind: 'active', block, reason: 'budget', endsAt: nextMidnight(at) }
      : { kind: 'inactive' };
  }

  if (!isInsideScheduleWindow(block, at)) {
    const next = nextStartAfter(block, at);
    return next === null
      ? { kind: 'inactive' }
      : {
          kind: 'active',
          block,
          reason: 'outsideSchedule',
          endsAt: next.at,
        };
  }

  if (isBudgetExceededAt(block, at)) {
    const next = nextStartAfter(block, at);
    return next === null
      ? { kind: 'inactive' }
      : { kind: 'active', block, reason: 'budget', endsAt: next.at };
  }

  return { kind: 'inactive' };
}
