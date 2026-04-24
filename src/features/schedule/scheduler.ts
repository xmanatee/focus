import {
  type Action,
  type DeviceActivitySchedule,
  cleanUpAfterActivity,
  configureActions,
  getActivities,
  startMonitoring,
  stopMonitoring,
} from 'react-native-device-activity';
import type { BlockSelection } from '../blocker/types';
import { hasSavedActivitySelection } from '../blocker/types';
import type { DayOfWeek } from './types';

const DAY_WEEKDAY_INDEX: Record<DayOfWeek, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

const ACTIVITY_PREFIX = 'fucus_s_';

interface ScheduleSpec {
  readonly id: string;
  readonly days: readonly DayOfWeek[];
  readonly startTime: string;
  readonly endTime: string;
  readonly isEnabled: boolean;
  readonly profileSelection: BlockSelection;
}

interface MonitorPlan {
  readonly activityName: string;
  readonly schedule: DeviceActivitySchedule;
  readonly startActions: Action[];
  readonly endActions: Action[];
}

function parseHHMM(value: string): { hour: number; minute: number } {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute };
}

function activityName(scheduleId: string, day: DayOfWeek): string {
  return `${ACTIVITY_PREFIX}${scheduleId}_${day}`;
}

function actionsForSelection(
  selection: BlockSelection,
  phase: 'start' | 'end',
): Action[] {
  const actions: Action[] = [];
  if (hasSavedActivitySelection(selection.activitySelection)) {
    const selectionId = selection.activitySelection.selectionId;
    actions.push(
      phase === 'start'
        ? { type: 'blockSelection', familyActivitySelectionId: selectionId }
        : { type: 'unblockSelection', familyActivitySelectionId: selectionId },
    );
  }
  if (selection.webDomains.length > 0) {
    actions.push(
      phase === 'start'
        ? {
            type: 'setWebContentFilterPolicy',
            policy: { type: 'specific', domains: [...selection.webDomains] },
          }
        : { type: 'clearWebContentFilterPolicy' },
    );
  }
  return actions;
}

function materializeSchedule(spec: ScheduleSpec): MonitorPlan[] {
  if (!spec.isEnabled) {
    return [];
  }

  const { hour: sh, minute: sm } = parseHHMM(spec.startTime);
  const { hour: eh, minute: em } = parseHHMM(spec.endTime);
  const startActions = actionsForSelection(spec.profileSelection, 'start');
  const endActions = actionsForSelection(spec.profileSelection, 'end');

  return spec.days.map((day) => ({
    activityName: activityName(spec.id, day),
    schedule: {
      intervalStart: { weekday: DAY_WEEKDAY_INDEX[day], hour: sh, minute: sm },
      intervalEnd: { weekday: DAY_WEEKDAY_INDEX[day], hour: eh, minute: em },
      repeats: true,
    },
    startActions,
    endActions,
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

export async function reconcileSchedules(
  specs: readonly ScheduleSpec[],
): Promise<void> {
  const desired = new Map<string, MonitorPlan>();
  for (const spec of specs) {
    for (const plan of materializeSchedule(spec)) {
      desired.set(plan.activityName, plan);
    }
  }

  const current = getActivities().filter((name) =>
    name.startsWith(ACTIVITY_PREFIX),
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
