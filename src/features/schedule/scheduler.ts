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

export interface FocusBlockSpec {
  id: string;
  name: string;
  days: DayOfWeek[];
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isEnabled: boolean;
  profileSelection: BlockSelection;
  notifyOnStart: boolean;
  notifyOnEnd: boolean;
}

const ACTIVITY_PREFIX = 'fucus.block.';
const SETUP_ACTIVITY_NAME = 'fucus.setup';

interface MonitorPlan {
  activityName: string;
  schedule: {
    intervalStart: { hour: number; minute: number };
    intervalEnd: { hour: number; minute: number };
    repeats: boolean;
    warningThreshold?: { minute: number };
  };
  startActions: Action[];
  endActions: Action[];
}

function materializeFocusBlock(spec: FocusBlockSpec): MonitorPlan[] {
  if (!spec.isEnabled || spec.days.length === 0) {
    return [];
  }

  const [startH, startM] = spec.startTime.split(':').map(Number);
  const [endH, endM] = spec.endTime.split(':').map(Number);

  const startActions: Action[] = [];
  const endActions: Action[] = [];

  // 1. Handle App/Category blocking
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

  // 2. Handle Website blocking
  if (spec.profileSelection.webDomains.length > 0) {
    startActions.push({
      type: 'setWebContentFilterPolicy',
      policy: {
        type: 'specific',
        domains: [...spec.profileSelection.webDomains],
      },
    });
    endActions.push({
      type: 'clearWebContentFilterPolicy',
    });
  }

  // 3. Handle Notifications
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
      intervalStart: { hour: startH ?? 0, minute: startM ?? 0 },
      intervalEnd: { hour: endH ?? 0, minute: endM ?? 0 },
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

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

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
      intervalStart: { hour: startH ?? 0, minute: startM ?? 0 },
      intervalEnd: { hour: endH ?? 0, minute: endM ?? 0 },
      repeats: true,
    },
    startActions,
    endActions: [],
  }));
}

async function applyPlan(plan: MonitorPlan): Promise<void> {
  try {
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
  } catch {
    // Ignore native failures to avoid crashing the JS app
  }
}

export async function reconcileFocusBlocks(
  specs: readonly FocusBlockSpec[],
  setupBlock?: {
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

  let current: string[] = [];
  try {
    current = getActivities().filter(
      (name) =>
        name?.startsWith(ACTIVITY_PREFIX) ||
        name?.startsWith(SETUP_ACTIVITY_NAME),
    );
  } catch {
    // Return early if native module fails
    return;
  }

  const toStop = current.filter((name) => !desired.has(name));
  if (toStop.length > 0) {
    try {
      stopMonitoring(toStop);
      for (const name of toStop) {
        cleanUpAfterActivity(name);
      }
    } catch {
      // Ignore native cleanup failures
    }
  }

  for (const plan of desired.values()) {
    await applyPlan(plan);
  }
}
