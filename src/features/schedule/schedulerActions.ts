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
import { getSlotValue, isSlotPopulated } from '../blocker/selectionSlot';
import {
  hasSavedActivitySelection,
  selectionIdForBlock,
} from '../blocker/types';
import type { DayOfWeek, FocusBlock } from './types';

export const FOCUS_ACTIVITY_PREFIX = 'focusblocks.block.';
export const BUDGET_ACTIVITY_PREFIX = 'focusblocks.budget.';
export const SETUP_ACTIVITY_PREFIX = 'focusblocks.setup.';
const BUDGET_EVENT_NAME = 'limit';

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

export type FocusAction = Action & {
  readonly onlyIfTriggeredAfter?: TriggeredAfterCondition;
};

export interface MonitorPlan {
  activityName: string;
  schedule: {
    intervalStart: { hour: number; minute: number; weekday: number };
    intervalEnd: { hour: number; minute: number; weekday: number };
    repeats: boolean;
  };
  events: DeviceActivityEvent[];
  startActions: FocusAction[];
  endActions: FocusAction[];
  eventActions: readonly {
    readonly eventName: string;
    readonly actions: FocusAction[];
  }[];
}

function parseHM(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

function previousDay(day: DayOfWeek): DayOfWeek {
  const weekday = iosWeekday(day);
  return DAY_BY_IOS_WEEKDAY[weekday === 1 ? 7 : weekday - 1];
}

function isInsideScheduleAtWeeklyInstant(
  block: FocusBlock,
  day: DayOfWeek,
  minute: number,
): boolean {
  const start = minutesOf(block.startTime);
  const end = minutesOf(block.endTime);

  if (!isOvernightRange(block.startTime, block.endTime)) {
    return block.days.includes(day) && minute >= start && minute < end;
  }

  return (
    (block.days.includes(day) && minute >= start) ||
    (block.days.includes(previousDay(day)) && minute < end)
  );
}

function isActiveAtWeeklyInstant(
  block: FocusBlock,
  day: DayOfWeek,
  minute: number,
): boolean {
  if (!block.isEnabled) return false;
  if (block.rule.kind === 'dailyBudget') return false;

  const isInsideWindow = isInsideScheduleAtWeeklyInstant(block, day, minute);
  if (block.rule.kind === 'allowDuringSchedule') return !isInsideWindow;
  if (block.rule.kind === 'allowDuringScheduleWithBudget') {
    return !isInsideWindow;
  }
  return isInsideWindow;
}

function hasLocalActivitySelection(block: FocusBlock): boolean {
  return (
    hasSavedActivitySelection(block.selection.activitySelection) &&
    isSlotPopulated(selectionIdForBlock(block.id))
  );
}

export function budgetMinutes(block: FocusBlock): number | null {
  if (block.rule.kind === 'dailyBudget') return block.rule.minutes;
  if (block.rule.kind === 'allowDuringScheduleWithBudget') {
    return block.rule.minutes;
  }
  return null;
}

export function budgetActivityName(block: FocusBlock, day: DayOfWeek): string {
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
  block: FocusBlock,
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
  block: FocusBlock,
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
  const previous = previousDay(day);
  if (block.days.includes(previous) && minute < end) {
    originDays.push(previous);
  }
  return originDays;
}

function addSelectionAction(
  actions: FocusAction[],
  block: FocusBlock,
  condition?: TriggeredAfterCondition,
): void {
  if (!hasLocalActivitySelection(block)) return;
  actions.push({
    type: 'blockSelection',
    familyActivitySelectionId: selectionIdForBlock(block.id),
    ...(condition ? { onlyIfTriggeredAfter: condition } : {}),
  });
}

export function reconcileActionsForInstant(
  blocks: readonly FocusBlock[],
  day: DayOfWeek,
  minute: number,
): FocusAction[] {
  const activeBlocks = blocks.filter((block) =>
    isActiveAtWeeklyInstant(block, day, minute),
  );
  const webDomains = new Set<string>();
  const actions: FocusAction[] = [
    { type: 'resetBlocks' },
    { type: 'clearWebContentFilterPolicy' },
  ];

  for (const block of activeBlocks) {
    addSelectionAction(actions, block);
    for (const domain of block.selection.webDomains) webDomains.add(domain);
  }

  for (const block of blocks) {
    if (!block.isEnabled || budgetMinutes(block) === null) continue;
    for (const originDay of budgetOriginDaysAtWeeklyInstant(
      block,
      day,
      minute,
    )) {
      addSelectionAction(actions, block, budgetCondition(block, originDay));
    }
  }

  if (webDomains.size > 0) {
    actions.push({
      type: 'setWebContentFilterPolicy',
      policy: { type: 'specific', domains: [...webDomains].sort() },
    });
  }

  return actions;
}

export function budgetEvents(block: FocusBlock): DeviceActivityEvent[] {
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
  block: FocusBlock,
): MonitorPlan['eventActions'] {
  const minutes = budgetMinutes(block);
  if (minutes === null || !hasLocalActivitySelection(block)) return [];
  return [
    {
      eventName: BUDGET_EVENT_NAME,
      actions: [
        {
          type: 'blockSelection',
          familyActivitySelectionId: selectionIdForBlock(block.id),
        },
      ],
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
    intervalStart: { ...parseHM(startTime), weekday: startWeekday },
    intervalEnd: { ...parseHM(endTime), weekday: endWeekday },
    repeats: true,
  };
}
