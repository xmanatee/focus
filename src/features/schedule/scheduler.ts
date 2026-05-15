import {
  type Action,
  cleanUpAfterActivity,
  configureActions,
  getActivities,
  startMonitoring,
  stopMonitoring,
} from 'react-native-device-activity';
import {
  iosWeekday,
  isOvernightRange,
  minutesOf,
  nextIosWeekday,
} from '../../shared/days';
import {
  hasSavedActivitySelection,
  selectionIdForBlock,
} from '../blocker/types';
import type { DayOfWeek, FocusBlock } from './types';

const FOCUS_ACTIVITY_PREFIX = 'focusblocks.block.';
const SETUP_ACTIVITY_PREFIX = 'focusblocks.setup.';

const DAY_BY_IOS_WEEKDAY: Record<number, DayOfWeek> = {
  1: 'sun',
  2: 'mon',
  3: 'tue',
  4: 'wed',
  5: 'thu',
  6: 'fri',
  7: 'sat',
};

interface MonitorPlan {
  activityName: string;
  schedule: {
    intervalStart: { hour: number; minute: number; weekday: number };
    intervalEnd: { hour: number; minute: number; weekday: number };
    repeats: boolean;
  };
  startActions: Action[];
  endActions: Action[];
}

function parseHM(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

function previousDay(day: DayOfWeek): DayOfWeek {
  const weekday = iosWeekday(day);
  return DAY_BY_IOS_WEEKDAY[weekday === 1 ? 7 : weekday - 1];
}

function isActiveAtWeeklyInstant(
  block: FocusBlock,
  day: DayOfWeek,
  minute: number,
): boolean {
  if (!block.isEnabled) return false;

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

function reconcileActionsForInstant(
  blocks: readonly FocusBlock[],
  day: DayOfWeek,
  minute: number,
): Action[] {
  const activeBlocks = blocks.filter((block) =>
    isActiveAtWeeklyInstant(block, day, minute),
  );
  const webDomains = new Set<string>();
  const actions: Action[] = [
    { type: 'resetBlocks' },
    { type: 'clearWebContentFilterPolicy' },
  ];

  for (const block of activeBlocks) {
    if (hasSavedActivitySelection(block.selection.activitySelection)) {
      actions.push({
        type: 'blockSelection',
        familyActivitySelectionId: selectionIdForBlock(block.id),
      });
    }
    for (const domain of block.selection.webDomains) {
      webDomains.add(domain);
    }
  }

  if (webDomains.size > 0) {
    actions.push({
      type: 'setWebContentFilterPolicy',
      policy: {
        type: 'specific',
        domains: [...webDomains].sort(),
      },
    });
  }

  return actions;
}

function materializeFocusBlock(
  block: FocusBlock,
  allBlocks: readonly FocusBlock[],
): MonitorPlan[] {
  if (!block.isEnabled || block.days.length === 0) {
    return [];
  }

  return block.days.map((day) => {
    const schedule = scheduleForDay(block.startTime, block.endTime, day);
    const startMinute = minutesOf(block.startTime);
    const endMinute = minutesOf(block.endTime);
    const endDay = DAY_BY_IOS_WEEKDAY[schedule.intervalEnd.weekday];

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
      activityName: `${FOCUS_ACTIVITY_PREFIX}${block.id}.${day}`,
      schedule,
      startActions,
      endActions,
    };
  });
}

function materializeSetupBlock(
  days: readonly DayOfWeek[],
  startTime: string,
  endTime: string,
  notifyOnStart: boolean,
): MonitorPlan[] {
  if (!notifyOnStart || days.length === 0) {
    return [];
  }

  const startActions: Action[] = [
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
    startActions,
    endActions: [],
  }));
}

function scheduleForDay(
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

async function applyPlan(plan: MonitorPlan): Promise<void> {
  configureActions({
    activityName: plan.activityName,
    callbackName: 'intervalDidStart',
    actions: plan.startActions,
  });
  configureActions({
    activityName: plan.activityName,
    callbackName: 'intervalDidEnd',
    actions: plan.endActions,
  });
  await startMonitoring(plan.activityName, plan.schedule, []);
}

export async function reconcileFocusBlocks(
  blocks: readonly FocusBlock[],
  setupBlock: {
    days: readonly DayOfWeek[];
    startTime: string;
    endTime: string;
    notifyOnStart: boolean;
  } | null,
): Promise<void> {
  const desired = new Map<string, MonitorPlan>();
  for (const block of blocks) {
    for (const plan of materializeFocusBlock(block, blocks)) {
      desired.set(plan.activityName, plan);
    }
  }

  if (setupBlock) {
    for (const plan of materializeSetupBlock(
      setupBlock.days,
      setupBlock.startTime,
      setupBlock.endTime,
      setupBlock.notifyOnStart,
    )) {
      desired.set(plan.activityName, plan);
    }
  }

  const current = getActivities().filter(
    (name) =>
      name?.startsWith(FOCUS_ACTIVITY_PREFIX) ||
      name?.startsWith(SETUP_ACTIVITY_PREFIX),
  );

  const toStop = current.filter((name) => !desired.has(name));
  if (toStop.length > 0) {
    stopMonitoring(toStop);
    for (const name of toStop) {
      cleanUpAfterActivity(name);
    }
  }

  for (const plan of desired.values()) {
    await applyPlan(plan);
  }
}
