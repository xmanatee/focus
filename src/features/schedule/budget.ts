import type { FocusBlockInput } from './types';

export const BUDGET_WARNING_MINUTES = 5;
export const MIN_DAILY_BUDGET_MINUTES = 1;
export const MAX_DAILY_BUDGET_MINUTES = 23 * 60 + 59;

export function inputUsesBudgetWarning(input: FocusBlockInput): boolean {
  return 'minutes' in input.rule && input.rule.minutes > BUDGET_WARNING_MINUTES;
}

export function budgetMinutesError(minutes: number): string | null {
  if (
    !Number.isInteger(minutes) ||
    minutes < MIN_DAILY_BUDGET_MINUTES ||
    minutes > MAX_DAILY_BUDGET_MINUTES
  ) {
    return 'Daily budget must be between 1 minute and 23h 59m.';
  }
  return null;
}
