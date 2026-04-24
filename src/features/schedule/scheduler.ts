import {
  type Action,
  cleanUpAfterActivity,
  configureActions,
  getActivities,
  startMonitoring,
  stopMonitoring,
} from 'react-native-device-activity';
import type { BlockSelection } from '../blocker/types';
import type { DayOfWeek } from './types';

export interface FocusBlockSpec {
  id: string;
  days: DayOfWeek[];
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isEnabled: boolean;
  profileSelection: BlockSelection;
}

const ACTIVITY_PREFIX = 'fucus.block.';

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

  const startActions: Action[] = [
    {
      type: 'shield',
      selection: spec.profileSelection.activitySelection,
      webDomains: spec.profileSelection.webDomains,
    },
  ];

  const endActions: Action[] = [
    {
      type: 'unshield',
      selection: spec.profileSelection.activitySelection,
      webDomains: spec.profileSelection.webDomains,
    },
  ];

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
): Promise<void> {
  const desired = new Map<string, MonitorPlan>();
  for (const spec of specs) {
    for (const plan of materializeFocusBlock(spec)) {
      desired.set(plan.activityName, plan);
    }
  }

  let current: string[] = [];
  try {
    current = getActivities().filter((name) =>
      name?.startsWith(ACTIVITY_PREFIX),
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
