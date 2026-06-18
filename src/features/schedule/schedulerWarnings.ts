import { BUDGET_WARNING_MINUTES } from './budget';
import {
  BUDGET_EVENT_NAME,
  type MonitorPlan,
  budgetMinutes,
  hasLocalActivitySelection,
} from './schedulerActions';
import type { RuntimeFocusBlock } from './types';

export function budgetEventWarningActions(
  block: RuntimeFocusBlock,
): MonitorPlan['eventWarningActions'] {
  const minutes = budgetMinutes(block);
  if (
    minutes === null ||
    minutes <= BUDGET_WARNING_MINUTES ||
    !hasLocalActivitySelection(block)
  ) {
    return [];
  }
  return [
    {
      eventName: BUDGET_EVENT_NAME,
      actions: [
        {
          type: 'sendNotification',
          payload: {
            title: 'Budget Almost Used',
            body: `"${block.name}" has ${BUDGET_WARNING_MINUTES} minutes left before it is blocked.`,
            sound: 'default',
            interruptionLevel: 'active',
          },
        },
      ],
    },
  ];
}

export function budgetWarningTime(
  block: RuntimeFocusBlock,
): MonitorPlan['schedule']['warningTime'] {
  const minutes = budgetMinutes(block);
  if (minutes === null || minutes <= BUDGET_WARNING_MINUTES) return undefined;
  return { minute: BUDGET_WARNING_MINUTES };
}
