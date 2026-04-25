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
  nextIosWeekday,
} from '../../shared/days';
import {
  hasSavedActivitySelection,
  selectionIdForBlock,
} from '../blocker/types';
import type { DayOfWeek, FocusBlock } from './types';

const FOCUS_ACTIVITY_PREFIX = 'focusblocks.block.';
const SETUP_ACTIVITY_PREFIX = 'focusblocks.setup.';

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

function materializeFocusBlock(block: FocusBlock): MonitorPlan[] {
  if (!block.isEnabled || block.days.length === 0) {
    return [];
  }

  const startActions: Action[] = [];
  const endActions: Action[] = [];

  if (hasSavedActivitySelection(block.selection.activitySelection)) {
    const selectionId = selectionIdForBlock(block.id);
    startActions.push({
      type: 'blockSelection',
      familyActivitySelectionId: selectionId,
    });
    endActions.push({
      type: 'unblockSelection',
      familyActivitySelectionId: selectionId,
    });
  }

  if (block.selection.webDomains.length > 0) {
    startActions.push({
      type: 'setWebContentFilterPolicy',
      policy: {
        type: 'specific',
        domains: [...block.selection.webDomains],
      },
    });
    endActions.push({ type: 'clearWebContentFilterPolicy' });
  }

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

  return block.days.map((day) => ({
    activityName: `${FOCUS_ACTIVITY_PREFIX}${block.id}.${day}`,
    schedule: scheduleForDay(block.startTime, block.endTime, day),
    startActions,
    endActions,
  }));
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
    for (const plan of materializeFocusBlock(block)) {
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
