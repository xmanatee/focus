import { validateDays, validateTimeRange } from '../../shared/days';
import {
  hasSavedActivitySelection,
  selectionHasBlockedTargets,
} from '../blocker/types';
import type { FocusBlockInput } from './types';

const MAX_NAME_LENGTH = 50;
const MIN_DAILY_LIMIT_MINUTES = 1;
const MAX_DAILY_LIMIT_MINUTES = 23 * 60 + 59;

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
  const usesDailyBudget =
    input.rule.kind === 'dailyBudget' ||
    input.rule.kind === 'allowDuringScheduleWithBudget';
  if (usesDailyBudget) {
    if (
      !Number.isInteger(input.rule.minutes) ||
      input.rule.minutes < MIN_DAILY_LIMIT_MINUTES ||
      input.rule.minutes > MAX_DAILY_LIMIT_MINUTES
    ) {
      throw new Error('Daily budget must be between 1 minute and 23h 59m.');
    }
    if (!hasSavedActivitySelection(input.selection.activitySelection)) {
      throw new Error(
        'Daily budgets require apps, categories, or domains from the Screen Time picker.',
      );
    }
  }
  if (
    input.scope.kind === 'device' &&
    input.scope.deviceId.trim().length === 0
  ) {
    throw new Error('Device-scoped blocks require a device ID.');
  }
  if (input.strict && !selectionHasBlockedTargets(input.selection)) {
    throw new Error('A strict block must block at least one app or site.');
  }
}
