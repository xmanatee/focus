import { iosWeekday, minutesOf, nextIosWeekday } from '../../shared/days';
import {
  BUDGET_ACTIVITY_PREFIX,
  DAY_BY_IOS_WEEKDAY,
  FOCUS_ACTIVITY_PREFIX,
  type FocusAction,
  type MonitorPlan,
  SETUP_ACTIVITY_PREFIX,
  budgetActivityName,
  budgetEventActions,
  budgetEvents,
  reconcileActionsForInstant,
  scheduleForDay,
} from './schedulerActions';
import {
  budgetEventWarningActions,
  budgetWarningTime,
} from './schedulerWarnings';
import type { DayOfWeek, RuntimeFocusBlock } from './types';

function dailyBudgetPlan(
  block: RuntimeFocusBlock,
  allBlocks: readonly RuntimeFocusBlock[],
): MonitorPlan[] {
  if (!block.isEnabled || block.rule.kind !== 'dailyBudget') return [];
  const events = budgetEvents(block);
  if (events.length === 0) return [];
  return block.days.map((day) => {
    const startWeekday = iosWeekday(day);
    const endWeekday = nextIosWeekday(startWeekday);
    const endDay = DAY_BY_IOS_WEEKDAY[endWeekday];
    const warningTime = budgetWarningTime(block);

    return {
      activityName: budgetActivityName(block, day),
      schedule: {
        intervalStart: { hour: 0, minute: 0, weekday: startWeekday },
        intervalEnd: { hour: 0, minute: 0, weekday: endWeekday },
        repeats: true,
        ...(warningTime ? { warningTime } : {}),
      },
      events,
      startActions: reconcileActionsForInstant(allBlocks, day, 0),
      endActions: reconcileActionsForInstant(allBlocks, endDay, 0),
      eventActions: budgetEventActions(block),
      eventWarningActions: budgetEventWarningActions(block),
    };
  });
}

export function materializeFocusBlock(
  block: RuntimeFocusBlock,
  allBlocks: readonly RuntimeFocusBlock[],
): MonitorPlan[] {
  if (!block.isEnabled || block.days.length === 0) return [];
  if (block.rule.kind === 'dailyBudget')
    return dailyBudgetPlan(block, allBlocks);

  return block.days.map((day) => {
    const schedule = scheduleForDay(block.startTime, block.endTime, day);
    const startMinute = minutesOf(block.startTime);
    const endMinute = minutesOf(block.endTime);
    const endDay = DAY_BY_IOS_WEEKDAY[schedule.intervalEnd.weekday];
    const warningTime = budgetWarningTime(block);

    const startActions = reconcileActionsForInstant(
      allBlocks,
      day,
      startMinute,
    );
    const endActions = reconcileActionsForInstant(allBlocks, endDay, endMinute);

    if (block.notifyOnStart) {
      startActions.push({
        type: 'sendNotification',
        payload: {
          title: 'Focus Block Started',
          body: `"${block.name}" is now active. Distractions are blocked.`,
          sound: 'default',
          interruptionLevel: 'active',
        },
      });
    }

    if (block.notifyOnEnd) {
      endActions.push({
        type: 'sendNotification',
        payload: {
          title: 'Focus Block Ended',
          body: `"${block.name}" has finished.`,
          sound: 'default',
        },
      });
    }

    return {
      activityName:
        block.rule.kind === 'allowDuringScheduleWithBudget'
          ? budgetActivityName(block, day)
          : `${FOCUS_ACTIVITY_PREFIX}${block.id}.${day}`,
      schedule: {
        ...schedule,
        ...(warningTime ? { warningTime } : {}),
      },
      events: budgetEvents(block),
      startActions,
      endActions,
      eventActions: budgetEventActions(block),
      eventWarningActions: budgetEventWarningActions(block),
    };
  });
}

export function materializeSetupBlock(
  days: readonly DayOfWeek[],
  startTime: string,
  endTime: string,
  notifyOnStart: boolean,
): MonitorPlan[] {
  if (!notifyOnStart || days.length === 0) return [];

  const startActions: FocusAction[] = [
    {
      type: 'sendNotification',
      payload: {
        title: 'Setup Block Active',
        body: 'You can now edit your focus blocks.',
        sound: 'default',
        interruptionLevel: 'active',
      },
    },
  ];

  return days.map((day) => ({
    activityName: `${SETUP_ACTIVITY_PREFIX}${day}`,
    schedule: scheduleForDay(startTime, endTime, day),
    events: [],
    startActions,
    endActions: [],
    eventActions: [],
    eventWarningActions: [],
  }));
}

export function isFocusBlocksActivityName(name: string | undefined): boolean {
  return (
    name?.startsWith(FOCUS_ACTIVITY_PREFIX) ||
    name?.startsWith(BUDGET_ACTIVITY_PREFIX) ||
    name?.startsWith(SETUP_ACTIVITY_PREFIX) ||
    false
  );
}
