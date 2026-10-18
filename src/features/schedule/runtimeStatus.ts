import { DAY_BY_DATE_INDEX, nextOccurrenceOf } from '../../shared/days';
import { isInsideScheduleWindow, nextStartAfter } from './activeness';
import {
  budgetActivityName,
  budgetEventReachedAfterIntervalStart,
  budgetOriginDaysAtWeeklyInstant,
} from './schedulerActions';
import type { RuntimeFocusBlock } from './types';

export type ActiveReason = 'scheduled' | 'outsideSchedule' | 'budget';

export type FocusBlockRuntimeStatus =
  | { readonly kind: 'inactive' }
  | {
      readonly kind: 'active';
      readonly block: RuntimeFocusBlock;
      readonly reason: ActiveReason;
      readonly endsAt: Date;
    };

function nextMidnight(after: Date): Date {
  const at = new Date(after);
  at.setDate(at.getDate() + 1);
  at.setHours(0, 0, 0, 0);
  return at;
}

function isBudgetExceededAt(block: RuntimeFocusBlock, at: Date): boolean {
  const day = DAY_BY_DATE_INDEX[at.getDay()];
  const minute = at.getHours() * 60 + at.getMinutes();
  return budgetOriginDaysAtWeeklyInstant(block, day, minute).some((originDay) =>
    budgetEventReachedAfterIntervalStart(budgetActivityName(block, originDay)),
  );
}

export function getFocusBlockRuntimeStatus(
  block: RuntimeFocusBlock,
  at: Date,
): FocusBlockRuntimeStatus {
  if (!block.isEnabled) return { kind: 'inactive' };

  if (block.rule.kind === 'dailyBudget') {
    return isBudgetExceededAt(block, at)
      ? { kind: 'active', block, reason: 'budget', endsAt: nextMidnight(at) }
      : { kind: 'inactive' };
  }

  const inside = isInsideScheduleWindow(block, at);
  if (block.rule.kind === 'blockDuringSchedule') {
    return inside
      ? {
          kind: 'active',
          block,
          reason: 'scheduled',
          endsAt: nextOccurrenceOf(block.endTime, at),
        }
      : { kind: 'inactive' };
  }
  const reason = !inside
    ? 'outsideSchedule'
    : block.rule.kind === 'allowDuringScheduleWithBudget' &&
        isBudgetExceededAt(block, at)
      ? 'budget'
      : null;
  if (reason === null) return { kind: 'inactive' };
  const next = nextStartAfter(block, at);
  return next === null
    ? { kind: 'inactive' }
    : { kind: 'active', block, reason, endsAt: next.at };
}
