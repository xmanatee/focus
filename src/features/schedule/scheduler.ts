import {
  blockSelection,
  cleanUpAfterActivity,
  clearWebContentFilterPolicy,
  configureActions,
  getActivities,
  resetBlocks,
  setWebContentFilterPolicy,
  startMonitoring,
  stopMonitoring,
} from 'react-native-device-activity';
import {
  type FocusAction,
  type MonitorPlan,
  budgetEventReachedAfterIntervalStart,
  reconcileActionsForInstant,
} from './schedulerActions';
import {
  isFocusBlocksActivityName,
  materializeFocusBlock,
  materializeSetupBlock,
} from './schedulerPlan';
import type { DayOfWeek, FocusBlock } from './types';

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
  for (const eventAction of plan.eventActions) {
    configureActions({
      activityName: plan.activityName,
      callbackName: 'eventDidReachThreshold',
      eventName: eventAction.eventName,
      actions: eventAction.actions,
    });
  }
  for (const eventAction of plan.eventWarningActions) {
    configureActions({
      activityName: plan.activityName,
      callbackName: 'eventWillReachThresholdWarning',
      eventName: eventAction.eventName,
      actions: eventAction.actions,
    });
  }
  await startMonitoring(plan.activityName, plan.schedule, plan.events);
}

const DAY_BY_DATE_INDEX: readonly DayOfWeek[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

function shouldExecuteNow(action: FocusAction): boolean {
  const condition = action.onlyIfTriggeredAfter;
  if (condition === undefined) return true;
  return budgetEventReachedAfterIntervalStart(condition.activityName);
}

function executeActionNow(action: FocusAction): void {
  if (!shouldExecuteNow(action)) return;
  if (action.type === 'resetBlocks') {
    resetBlocks('focusblocks current-state reconcile');
    return;
  }
  if (action.type === 'clearWebContentFilterPolicy') {
    clearWebContentFilterPolicy('focusblocks current-state reconcile');
    return;
  }
  if (action.type === 'blockSelection') {
    blockSelection(
      { activitySelectionId: action.familyActivitySelectionId },
      'focusblocks current-state reconcile',
    );
    return;
  }
  if (action.type === 'setWebContentFilterPolicy') {
    setWebContentFilterPolicy(
      action.policy,
      'focusblocks current-state reconcile',
    );
  }
}

function applyCurrentState(blocks: readonly FocusBlock[], at: Date): void {
  const day = DAY_BY_DATE_INDEX[at.getDay()];
  const minute = at.getHours() * 60 + at.getMinutes();
  for (const action of reconcileActionsForInstant(blocks, day, minute)) {
    executeActionNow(action);
  }
}

export async function reconcileFocusBlocks(
  blocks: readonly FocusBlock[],
  setupBlock: {
    days: readonly DayOfWeek[];
    startTime: string;
    endTime: string;
    notifyOnStart: boolean;
  } | null,
  at: Date = new Date(),
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

  const current = getActivities().filter(isFocusBlocksActivityName);
  const toStop = current.filter((name) => !desired.has(name));
  if (toStop.length > 0) {
    stopMonitoring(toStop);
    for (const name of toStop) cleanUpAfterActivity(name);
  }

  for (const plan of desired.values()) await applyPlan(plan);
  applyCurrentState(blocks, at);
}
