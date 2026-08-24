import {
  BlockerBridge,
  type DeviceActivityAction,
} from '../../bridge/BlockerBridge';
import { assertRuntimeMonitorCapacity } from './runtimeCapacity';
import {
  loadRuntimePlanSignatures,
  saveRuntimePlanSignatures,
} from './runtimePlanCache';
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

function configuredActions(
  actions: readonly FocusAction[],
): DeviceActivityAction[] {
  return [...actions] as DeviceActivityAction[];
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

async function reconcileMonitoringPlans(
  desired: ReadonlyMap<string, MonitorPlan>,
): Promise<void> {
  const native = BlockerBridge.deviceActivity;
  const current = new Set(
    native.getActivities().filter(isFocusBlocksActivityName),
  );
  const storedSignatures = await loadRuntimePlanSignatures();
  const desiredSignatures = Object.fromEntries(
    [...desired].map(([name, plan]) => [name, JSON.stringify(plan)]),
  );
  const changed = new Set(
    [...desired].flatMap(([name]) =>
      current.has(name) && storedSignatures[name] !== desiredSignatures[name]
        ? [name]
        : [],
    ),
  );
  const toStop = [...current].filter(
    (name) => !desired.has(name) || changed.has(name),
  );

  if (toStop.length > 0) {
    native.stopMonitoring(toStop);
    for (const name of toStop) native.cleanUpAfterActivity(name);
  }

  for (const [name, plan] of desired) {
    if (current.has(name) && !changed.has(name)) continue;
    await applyPlan(plan);
  }
  await saveRuntimePlanSignatures(desiredSignatures);
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

async function performReconciliation(
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
    await BlockerBridge.reconcileRuntimeBlocks(blocks);
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

  assertRuntimeMonitorCapacity(blocks, setupBlock);

  await reconcileMonitoringPlans(desired);
  applyCurrentState(blocks, at);
}

let pendingReconciliation = Promise.resolve();

export function reconcileFocusBlocks(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: {
    days: readonly DayOfWeek[];
    startTime: string;
    endTime: string;
    notifyOnStart: boolean;
  } | null,
  at: Date = new Date(),
): Promise<void> {
  const reconcile = () => performReconciliation(blocks, setupBlock, at);
  const current = pendingReconciliation.then(reconcile, reconcile);
  pendingReconciliation = current;
  return current;
}
