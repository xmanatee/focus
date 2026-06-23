import {
  rangeDurationMinutes,
  validateDays,
  validateTimeRange,
} from '../../shared/days';
import {
  hasSavedActivitySelection,
  selectionHasBlockedTargets,
} from '../blocker/types';
import { MAX_DAILY_BUDGET_MINUTES, MIN_DAILY_BUDGET_MINUTES } from './budget';
import type { FocusBlockInput } from './types';

const MAX_NAME_LENGTH = 50;
export const MAX_WEB_DOMAINS = 50;
const MIN_DEVICE_ACTIVITY_INTERVAL_MINUTES = 15;

function ruleUsesScheduleWindow(input: FocusBlockInput): boolean {
  return input.rule.kind !== 'dailyBudget';
}

export function validateFocusBlockInput(input: FocusBlockInput): void {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new Error('Block name is required.');
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error('Block name is too long.');
  }
  validateDays(input.days);
  validateTimeRange(input.startTime, input.endTime);
  if (
    ruleUsesScheduleWindow(input) &&
    rangeDurationMinutes(input.startTime, input.endTime) <
      MIN_DEVICE_ACTIVITY_INTERVAL_MINUTES
  ) {
    throw new Error('Scheduled blocks must be at least 15 minutes.');
  }
  if (input.selection.webDomains.length > MAX_WEB_DOMAINS) {
    throw new Error('iOS can filter up to 50 websites per block.');
  }
  const usesDailyBudget =
    input.rule.kind === 'dailyBudget' ||
    input.rule.kind === 'allowDuringScheduleWithBudget';
  if (usesDailyBudget) {
    if (
      !Number.isInteger(input.rule.minutes) ||
      input.rule.minutes < MIN_DAILY_BUDGET_MINUTES ||
      input.rule.minutes > MAX_DAILY_BUDGET_MINUTES
    ) {
      throw new Error('Daily budget must be between 1 minute and 23h 59m.');
    }
    if (!hasSavedActivitySelection(input.selection.activitySelection)) {
      throw new Error(
        'Daily budgets require apps, categories, or domains from the Screen Time picker.',
      );
    }
  }
  if (input.strict && !selectionHasBlockedTargets(input.selection)) {
    throw new Error('A strict block must block at least one app or site.');
  }
}
