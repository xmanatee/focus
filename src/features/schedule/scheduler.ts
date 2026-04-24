import {
  type Action,
  cleanUpAfterActivity,
  configureActions,
  getActivities,
  startMonitoring,
  stopMonitoring,
} from 'react-native-device-activity';
import { hasSavedActivitySelection } from '../blocker/types';
import type { BlockSelection } from '../blocker/types';
import type { DayOfWeek } from './types';

interface FocusBlockSpec {
  id: string;
  name: string;
  days: DayOfWeek[];
  startTime: string; // HH:mm, validated upstream
  endTime: string; // HH:mm, validated upstream
  isEnabled: boolean;
  profileSelection: BlockSelection;
  notifyOnStart: boolean;
  notifyOnEnd: boolean;
}

const ACTIVITY_PREFIX = 'focusblocks.block.';
const SETUP_ACTIVITY_NAME = 'focusblocks.setup';

interface MonitorPlan {
  activityName: string;
  schedule: {
    intervalStart: { hour: number; minute: number };
    intervalEnd: { hour: number; minute: number };
    repeats: boolean;
  };
  startActions: Action[];
  endActions: Action[];
}

function parseHM(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':').map(Number);
  return { hour: h, minute: m };
}

function materializeFocusBlock(spec: FocusBlockSpec): MonitorPlan[] {
  if (!spec.isEnabled || spec.days.length === 0) {
    return [];
  }

  const startActions: Action[] = [];
  const endActions: Action[] = [];

  if (hasSavedActivitySelection(spec.profileSelection.activitySelection)) {
    const selectionId = spec.profileSelection.activitySelection.selectionId;
    startActions.push({
      type: 'blockSelection',
      familyActivitySelectionId: selectionId,
    });
    endActions.push({
      type: 'unblockSelection',
      familyActivitySelectionId: selectionId,
    });
  }

  if (spec.profileSelection.webDomains.length > 0) {
    startActions.push({
      type: 'setWebContentFilterPolicy',
      policy: {
        type: 'specific',
        domains: [...spec.profileSelection.webDomains],
      },
    });
    endActions.push({ type: 'clearWebContentFilterPolicy' });
  }

  if (spec.notifyOnStart) {
    startActions.push({
      type: 'sendNotification',
      payload: {
        title: 'Focus Block Started',
        body: `"${spec.name}" is now active. Distractions are blocked.`,
        sound: 'default',
        interruptionLevel: 'active',
      },
    });
  }

  if (spec.notifyOnEnd) {
    endActions.push({
      type: 'sendNotification',
      payload: {
        title: 'Focus Block Ended',
        body: `"${spec.name}" has finished.`,
        sound: 'default',
      },
    });
  }

  return spec.days.map((day) => ({
    activityName: `${ACTIVITY_PREFIX}${spec.id}.${day}`,
    schedule: {
      intervalStart: parseHM(spec.startTime),
      intervalEnd: parseHM(spec.endTime),
      repeats: true,
    },
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
    activityName: `${SETUP_ACTIVITY_NAME}.${day}`,
    schedule: {
      intervalStart: parseHM(startTime),
      intervalEnd: parseHM(endTime),
      repeats: true,
    },
    startActions,
    endActions: [],
  }));
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
  specs: readonly FocusBlockSpec[],
  setupBlock: {
    days: readonly DayOfWeek[];
    startTime: string;
    endTime: string;
    notifyOnStart: boolean;
  } | null,
): Promise<void> {
  const desired = new Map<string, MonitorPlan>();
  for (const spec of specs) {
    for (const plan of materializeFocusBlock(spec)) {
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
      name?.startsWith(ACTIVITY_PREFIX) ||
      name?.startsWith(SETUP_ACTIVITY_NAME),
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
