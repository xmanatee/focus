import { expect } from 'vitest';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import { configuredActions } from './mockDeviceActivity';

export function savedSelection(
  webDomains: readonly string[] = [],
): RuntimeFocusBlock['selection'] {
  return {
    activitySelection: {
      status: 'saved',
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
      includeEntireCategory: true,
    },
    webDomains,
  };
}

export function runtimeBlock(
  overrides: Partial<RuntimeFocusBlock>,
): RuntimeFocusBlock {
  return {
    id: 'block',
    name: 'Block',
    startTime: '09:00',
    endTime: '17:00',
    days: ['mon'],
    isEnabled: true,
    selection: savedSelection(),
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: false,
    rule: { kind: 'blockDuringSchedule' },
    ...overrides,
  };
}

export function configuredActionsFor(
  activityName: string,
  callbackName: string,
) {
  const config = configuredActions.find(
    (entry) =>
      entry.activityName === activityName &&
      entry.callbackName === callbackName,
  );
  expect(config).toBeDefined();
  return config?.actions ?? [];
}

export const BUDGET_WEB_ACTIVITY = 'focusblocks.budget.budget-web.mon';

export function budgetWebBlock(
  webDomains: readonly string[] = ['youtube.com'],
): RuntimeFocusBlock {
  return runtimeBlock({
    id: 'budget-web',
    rule: { kind: 'dailyBudget', minutes: 10 },
    selection: savedSelection(webDomains),
  });
}
