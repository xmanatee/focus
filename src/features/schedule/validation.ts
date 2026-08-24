import {
  rangeDurationMinutes,
  validateDays,
  validateTimeRange,
} from '../../shared/days';
import { isRecord } from '../../shared/validation';
import { parseBlockedDomain } from '../blocker/domain';
import {
  hasSavedActivitySelection,
  selectionHasBlockedTargets,
} from '../blocker/types';
import { MAX_DAILY_BUDGET_MINUTES, MIN_DAILY_BUDGET_MINUTES } from './budget';
import { focusBlockUnsupportedReason } from './runtimeSupport';
import type { FocusBlockInput, FocusBlockRule } from './types';

const MAX_NAME_LENGTH = 50;
export const MAX_WEB_DOMAINS = 50;
const MIN_DEVICE_ACTIVITY_INTERVAL_MINUTES = 15;

function ruleUsesScheduleWindow(input: FocusBlockInput): boolean {
  return input.rule.kind !== 'dailyBudget';
}

function validateRule(rule: unknown): asserts rule is FocusBlockRule {
  if (!isRecord(rule) || typeof rule.kind !== 'string') {
    throw new Error('Block rule is invalid.');
  }
  switch (rule.kind) {
    case 'blockDuringSchedule':
    case 'allowDuringSchedule':
      return;
    case 'dailyBudget':
    case 'allowDuringScheduleWithBudget':
      if (typeof rule.minutes !== 'number') {
        throw new Error('Daily budget is invalid.');
      }
      return;
    default:
      throw new Error(`Unsupported block rule: ${rule.kind}.`);
  }
}

function validateSelection(selection: unknown): void {
  if (!isRecord(selection) || !Array.isArray(selection.webDomains)) {
    throw new Error('Block selection is invalid.');
  }
  const activity = selection.activitySelection;
  if (!isRecord(activity) || typeof activity.status !== 'string') {
    throw new Error('App selection is invalid.');
  }
  if (activity.status === 'saved') {
    const counts = [
      activity.applicationCount,
      activity.categoryCount,
      activity.webDomainCount,
    ];
    if (
      counts.some((count) => !Number.isInteger(count) || Number(count) < 0) ||
      counts.every((count) => count === 0) ||
      typeof activity.includeEntireCategory !== 'boolean'
    ) {
      throw new Error('Saved app selection is invalid.');
    }
  } else if (activity.status !== 'empty') {
    throw new Error(`Unsupported app selection status: ${activity.status}.`);
  }

  const domains = selection.webDomains;
  if (
    domains.some(
      (domain) =>
        typeof domain !== 'string' || parseBlockedDomain(domain) !== domain,
    ) ||
    new Set(domains).size !== domains.length
  ) {
    throw new Error('Blocked websites must be unique canonical domains.');
  }
}

export function validateFocusBlockStructure(input: FocusBlockInput): void {
  validateRule(input.rule);
  validateSelection(input.selection);
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
    throw new Error('Focus Blocks can filter up to 50 websites per block.');
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

export function validateFocusBlockInput(input: FocusBlockInput): void {
  validateFocusBlockStructure(input);
  const unsupportedReason = focusBlockUnsupportedReason(input);
  if (unsupportedReason !== null) throw new Error(unsupportedReason);
}
