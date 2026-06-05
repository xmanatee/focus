import type { FocusBlockInput, FocusBlockRule } from './types';

export const BUDGET_WARNING_MINUTES = 5;

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
