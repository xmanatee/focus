import {
  type Action,
  type DeviceActivityEvent,
  getEvents,
} from 'react-native-device-activity';
import {
  iosWeekday,
  isOvernightRange,
  minutesOf,
  nextIosWeekday,
} from '../../shared/days';
import { getSlotValue } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import { activitySelectionHasLocalSlot } from './localActivitySelection';
import type { DayOfWeek, RuntimeFocusBlock } from './types';
import {
  isActiveAtWeeklyInstant,
  scheduleTimeComponents,
} from './weeklyInstant';

export const FOCUS_ACTIVITY_PREFIX = 'focusblocks.block.';
export const BUDGET_ACTIVITY_PREFIX = 'focusblocks.budget.';
export const SETUP_ACTIVITY_PREFIX = 'focusblocks.setup.';
export const BUDGET_EVENT_NAME = 'limit';

export const DAY_BY_IOS_WEEKDAY: Record<number, DayOfWeek> = {
  1: 'sun',
  2: 'mon',
  3: 'tue',
  4: 'wed',
  5: 'thu',
  6: 'fri',
  7: 'sat',
};

export interface TriggeredAfterCondition {
  readonly activityName: string;
  readonly callbackName: 'eventDidReachThreshold';
  readonly eventName: string;
  readonly afterActivityName: string;
  readonly afterCallbackName: 'intervalDidStart';
}

type WebDomainAction = {
  readonly type: 'addWebContentFilterDomains';
  readonly domains: readonly string[];
};

export type FocusAction = (Action | WebDomainAction) & {
  readonly onlyIfTriggeredAfter?: TriggeredAfterCondition;
};

export interface MonitorPlan {
  activityName: string;
  schedule: {
    intervalStart: { hour: number; minute: number; weekday: number };
    intervalEnd: { hour: number; minute: number; weekday: number };
    repeats: boolean;
    warningTime?: { minute: number };
  };
  events: DeviceActivityEvent[];
  startActions: FocusAction[];
  endActions: FocusAction[];
  eventActions: readonly {
    readonly eventName: string;
    readonly actions: FocusAction[];
  }[];
  eventWarningActions: readonly {
    readonly eventName: string;
    readonly actions: FocusAction[];
  }[];
}

export function hasLocalActivitySelection(block: RuntimeFocusBlock): boolean {
  return activitySelectionHasLocalSlot(
    block.id,
    block.selection.activitySelection,
  );
}

export function budgetMinutes(block: RuntimeFocusBlock): number | null {
  if (block.rule.kind === 'dailyBudget') return block.rule.minutes;
  if (block.rule.kind === 'allowDuringScheduleWithBudget') {
    return block.rule.minutes;
  }
  return null;
}

export function budgetActivityName(
  block: RuntimeFocusBlock,
  day: DayOfWeek,
): string {
  return `${BUDGET_ACTIVITY_PREFIX}${block.id}.${day}`;
}

function thresholdForMinutes(
  minutes: number,
): DeviceActivityEvent['threshold'] {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return hour > 0 ? { hour, minute } : { minute };
}

function budgetCondition(
  block: RuntimeFocusBlock,
  day: DayOfWeek,
): TriggeredAfterCondition {
  const activityName = budgetActivityName(block, day);
  return {
    activityName,
    callbackName: 'eventDidReachThreshold',
    eventName: BUDGET_EVENT_NAME,
    afterActivityName: activityName,
    afterCallbackName: 'intervalDidStart',
  };
}

export function budgetEventReachedAfterIntervalStart(
  activityName: string,
): boolean {
  const events = getEvents(activityName);
  const threshold = events.find(
    (event) =>
      event.callbackName === 'eventDidReachThreshold' &&
      event.eventName === BUDGET_EVENT_NAME,
  );
  const intervalStart = events.find(
    (event) => event.callbackName === 'intervalDidStart',
  );
  if (threshold === undefined) return false;
  if (intervalStart === undefined) return true;
  return threshold.lastCalledAt > intervalStart.lastCalledAt;
}

export function budgetOriginDaysAtWeeklyInstant(
  block: RuntimeFocusBlock,
  day: DayOfWeek,
  minute: number,
): DayOfWeek[] {
  if (block.rule.kind === 'dailyBudget') {
    return block.days.includes(day) ? [day] : [];
  }
  if (block.rule.kind !== 'allowDuringScheduleWithBudget') return [];

  const start = minutesOf(block.startTime);
  const end = minutesOf(block.endTime);
  if (!isOvernightRange(block.startTime, block.endTime)) {
    return block.days.includes(day) && minute >= start && minute < end
      ? [day]
      : [];
  }

  const originDays: DayOfWeek[] = [];
  if (block.days.includes(day) && minute >= start) originDays.push(day);
  const previous =
    DAY_BY_IOS_WEEKDAY[iosWeekday(day) === 1 ? 7 : iosWeekday(day) - 1];
  if (block.days.includes(previous) && minute < end) {
    originDays.push(previous);
  }
  return originDays;
}

function addSelectionAction(
  actions: FocusAction[],
  block: RuntimeFocusBlock,
  condition?: TriggeredAfterCondition,
): void {
  if (!hasLocalActivitySelection(block)) return;
  actions.push({
    type: 'blockSelection',
    familyActivitySelectionId: selectionIdForBlock(block.id),
    ...(condition ? { onlyIfTriggeredAfter: condition } : {}),
  });
}

function addWebDomainAction(
  actions: FocusAction[],
  block: RuntimeFocusBlock,
  condition?: TriggeredAfterCondition,
): void {
  if (block.selection.webDomains.length === 0) return;
  actions.push({
    type: 'addWebContentFilterDomains',
    domains: [...new Set(block.selection.webDomains)].sort(),
    ...(condition ? { onlyIfTriggeredAfter: condition } : {}),
  });
}

export function reconcileActionsForInstant(
  blocks: readonly RuntimeFocusBlock[],
  day: DayOfWeek,
  minute: number,
): FocusAction[] {
  const actions: FocusAction[] = [
    { type: 'resetBlocks' },
    { type: 'clearWebContentFilterPolicy' },
  ];

  for (const block of blocks) {
    if (!isActiveAtWeeklyInstant(block, day, minute)) continue;
    addSelectionAction(actions, block);
    addWebDomainAction(actions, block);
  }

  for (const block of blocks) {
    if (!block.isEnabled || budgetMinutes(block) === null) continue;
    for (const originDay of budgetOriginDaysAtWeeklyInstant(
      block,
      day,
      minute,
    )) {
      const condition = budgetCondition(block, originDay);
      addSelectionAction(actions, block, condition);
      addWebDomainAction(actions, block, condition);
    }
  }

  return actions;
}

export function budgetEvents(block: RuntimeFocusBlock): DeviceActivityEvent[] {
  const minutes = budgetMinutes(block);
  const selection = getSlotValue(selectionIdForBlock(block.id));
  if (minutes === null || selection === undefined) return [];
  return [
    {
      eventName: BUDGET_EVENT_NAME,
      familyActivitySelection: selection,
      threshold: thresholdForMinutes(minutes),
      includesPastActivity: true,
    },
  ];
}

export function budgetEventActions(
  block: RuntimeFocusBlock,
): MonitorPlan['eventActions'] {
  const minutes = budgetMinutes(block);
  if (minutes === null || !hasLocalActivitySelection(block)) return [];
  const actions: FocusAction[] = [
    {
      type: 'blockSelection',
      familyActivitySelectionId: selectionIdForBlock(block.id),
    },
  ];
  if (block.selection.webDomains.length > 0) {
    actions.push({
      type: 'addWebContentFilterDomains',
      domains: [...new Set(block.selection.webDomains)].sort(),
    });
  }
  return [
    {
      eventName: BUDGET_EVENT_NAME,
      actions,
    },
  ];
}

export function scheduleForDay(
  startTime: string,
  endTime: string,
  day: DayOfWeek,
): MonitorPlan['schedule'] {
  const startWeekday = iosWeekday(day);
  const endWeekday = isOvernightRange(startTime, endTime)
    ? nextIosWeekday(startWeekday)
    : startWeekday;
  return {
    intervalStart: {
      ...scheduleTimeComponents(startTime),
      weekday: startWeekday,
    },
    intervalEnd: { ...scheduleTimeComponents(endTime), weekday: endWeekday },
    repeats: true,
  };
}
