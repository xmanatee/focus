import type { RuntimeFocusBlock } from '../features/schedule/types';
import { runtimeBlock, savedSelection } from './focusBlockFixtures';
import { configuredActions } from './mockDeviceActivity';

export function configuredActionsFor(
  activityName: string,
  callbackName: string,
) {
  const config = configuredActions.find(
    (entry) =>
      entry.activityName === activityName &&
      entry.callbackName === callbackName,
  );
  if (config === undefined)
    throw new Error(`No ${callbackName} actions for ${activityName}.`);
  return config.actions;
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
