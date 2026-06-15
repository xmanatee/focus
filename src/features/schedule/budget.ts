import type { FocusBlockInput, FocusBlockRule } from './types';

export const BUDGET_WARNING_MINUTES = 5;
export const MIN_DAILY_BUDGET_MINUTES = 1;
export const MAX_DAILY_BUDGET_MINUTES = 23 * 60 + 59;

function ruleUsesBudgetWarning(rule: FocusBlockRule): boolean {
  if (rule.kind === 'dailyBudget') {
    return rule.minutes > BUDGET_WARNING_MINUTES;
  }
  if (rule.kind === 'allowDuringScheduleWithBudget') {
    return rule.minutes > BUDGET_WARNING_MINUTES;
  }
  return false;
}

export function inputUsesBudgetWarning(input: FocusBlockInput): boolean {
  return ruleUsesBudgetWarning(input.rule);
}

export function budgetMinutesError(minutes: number): string | null {
  if (!Number.isInteger(minutes)) {
    return 'Daily budget must be between 1 minute and 23h 59m.';
  }
  if (
    minutes < MIN_DAILY_BUDGET_MINUTES ||
    minutes > MAX_DAILY_BUDGET_MINUTES
  ) {
    return 'Daily budget must be between 1 minute and 23h 59m.';
  }
  return null;
}
