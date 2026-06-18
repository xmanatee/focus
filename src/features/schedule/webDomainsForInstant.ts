import {
  budgetActivityName,
  budgetEventReachedAfterIntervalStart,
  budgetMinutes,
  budgetOriginDaysAtWeeklyInstant,
} from './schedulerActions';
import type { DayOfWeek, RuntimeFocusBlock } from './types';
import { isActiveAtWeeklyInstant } from './weeklyInstant';

function budgetTriggeredAtWeeklyInstant(
  block: RuntimeFocusBlock,
  day: DayOfWeek,
  minute: number,
): boolean {
  return budgetOriginDaysAtWeeklyInstant(block, day, minute).some((originDay) =>
    budgetEventReachedAfterIntervalStart(budgetActivityName(block, originDay)),
  );
}

export function webDomainsForInstant(
  blocks: readonly RuntimeFocusBlock[],
  day: DayOfWeek,
  minute: number,
): readonly string[] {
  const webDomains = new Set<string>();

  for (const block of blocks) {
    if (isActiveAtWeeklyInstant(block, day, minute)) {
      for (const domain of block.selection.webDomains) webDomains.add(domain);
      continue;
    }

    if (
      block.isEnabled &&
      budgetMinutes(block) !== null &&
      budgetTriggeredAtWeeklyInstant(block, day, minute)
    ) {
      for (const domain of block.selection.webDomains) webDomains.add(domain);
    }
  }

  return [...webDomains].sort();
}
