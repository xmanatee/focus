import {
  BlockerBridge,
  type DeviceActivityAction,
} from '../../bridge/BlockerBridge';
import { focusBlockUnsupportedReason } from './runtimeSupport';
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
import type { DayOfWeek, RuntimeFocusBlock } from './types';
import { webDomainsForInstant } from './webDomainsForInstant';

const MAX_DEVICE_ACTIVITY_MONITORS = 20;

function configuredActions(
  actions: readonly FocusAction[],
): DeviceActivityAction[] {
  return [...actions] as DeviceActivityAction[];
}

function assertDeviceActivityMonitorLimit(planCount: number): void {
  if (planCount <= MAX_DEVICE_ACTIVITY_MONITORS) return;
  throw new Error(
    `iOS can monitor up to ${MAX_DEVICE_ACTIVITY_MONITORS} Focus Block schedules at once. Disable some blocks or reduce selected days.`,
  );
}

async function applyPlan(plan: MonitorPlan): Promise<void> {
  const native = BlockerBridge.deviceActivity;
  native.configureActions({
    activityName: plan.activityName,
    callbackName: 'intervalDidStart',
    actions: configuredActions(plan.startActions),
  });
  native.configureActions({
    activityName: plan.activityName,
    callbackName: 'intervalDidEnd',
    actions: configuredActions(plan.endActions),
  });
  for (const eventAction of plan.eventActions) {
    native.configureActions({
      activityName: plan.activityName,
      callbackName: 'eventDidReachThreshold',
      eventName: eventAction.eventName,
      actions: configuredActions(eventAction.actions),
    });
  }
  for (const eventAction of plan.eventWarningActions) {
    native.configureActions({
      activityName: plan.activityName,
      callbackName: 'eventWillReachThresholdWarning',
      eventName: eventAction.eventName,
      actions: configuredActions(eventAction.actions),
    });
  }
  await native.startMonitoring(plan.activityName, plan.schedule, plan.events);
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
    BlockerBridge.deviceActivity.resetBlocks(
      'focusblocks current-state reconcile',
    );
    return;
  }
  if (action.type === 'blockSelection') {
    const selectionId = action.familyActivitySelectionId;
    if (typeof selectionId !== 'string') {
      throw new Error('Block selection action is missing its selection id.');
    }
    BlockerBridge.deviceActivity.blockSelection(
      { activitySelectionId: selectionId },
      'focusblocks current-state reconcile',
    );
    return;
  }
}

function applyCurrentState(
  blocks: readonly RuntimeFocusBlock[],
  at: Date,
): void {
  const day = DAY_BY_DATE_INDEX[at.getDay()];
  const minute = at.getHours() * 60 + at.getMinutes();
  for (const action of reconcileActionsForInstant(blocks, day, minute)) {
    executeActionNow(action);
  }
  const webDomains = webDomainsForInstant(blocks, day, minute);
  BlockerBridge.deviceActivity.clearWebContentFilterPolicy(
    'focusblocks current-state reconcile',
  );
  if (webDomains.length > 0) {
    BlockerBridge.deviceActivity.setWebContentFilterPolicy(
      { type: 'specific', domains: [...webDomains] },
      'focusblocks current-state reconcile',
    );
  }
}

function assertAndroidRuntimeSupport(
  blocks: readonly RuntimeFocusBlock[],
): void {
  for (const block of blocks) {
    if (!block.isEnabled) continue;
    const unsupportedReason = focusBlockUnsupportedReason(block);
    if (unsupportedReason !== null) throw new Error(unsupportedReason);
  }
}

export async function reconcileFocusBlocks(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: {
    days: readonly DayOfWeek[];
    startTime: string;
    endTime: string;
    notifyOnStart: boolean;
  } | null,
  at: Date = new Date(),
): Promise<void> {
  if (BlockerBridge.capabilities.runtimeKind === 'androidAccessibility') {
    assertAndroidRuntimeSupport(blocks);
    await BlockerBridge.reconcileRuntimeBlocks(blocks, at);
    return;
  }

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

  assertDeviceActivityMonitorLimit(desired.size);

  const native = BlockerBridge.deviceActivity;
  const current = native.getActivities().filter(isFocusBlocksActivityName);
  const toStop = current.filter((name) => !desired.has(name));
  if (toStop.length > 0) {
    native.stopMonitoring(toStop);
    for (const name of toStop) native.cleanUpAfterActivity(name);
  }

  for (const plan of desired.values()) await applyPlan(plan);
  applyCurrentState(blocks, at);
}
