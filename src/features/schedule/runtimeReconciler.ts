import * as DeviceActivity from 'react-native-device-activity';
import { DAY_BY_DATE_INDEX } from '../../shared/days';
import type { SetupBlock } from '../settings/adminState';
import { assertRuntimeCapacity } from './runtimeCapacity';
import {
  loadRuntimePlanSignatures,
  saveRuntimePlanSignatures,
} from './runtimePlanCache';
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
import type { RuntimeFocusBlock } from './types';

function configuredActions(
  actions: readonly FocusAction[],
): DeviceActivity.Action[] {
  return [...actions] as DeviceActivity.Action[];
}

async function applyPlan(plan: MonitorPlan): Promise<void> {
  const native = DeviceActivity;
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
  const native = DeviceActivity;
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

function shouldExecuteNow(action: FocusAction): boolean {
  const condition = action.onlyIfTriggeredAfter;
  return (
    condition === undefined ||
    budgetEventReachedAfterIntervalStart(condition.activityName)
  );
}

function applyCurrentState(
  blocks: readonly RuntimeFocusBlock[],
  at: Date,
): void {
  const day = DAY_BY_DATE_INDEX[at.getDay()];
  const minute = at.getHours() * 60 + at.getMinutes();
  const webDomains = new Set<string>();
  for (const action of reconcileActionsForInstant(blocks, day, minute)) {
    if (!shouldExecuteNow(action)) continue;
    switch (action.type) {
      case 'resetBlocks':
        DeviceActivity.resetBlocks('focusblocks current-state reconcile');
        break;
      case 'blockSelection':
        DeviceActivity.blockSelection(
          { activitySelectionId: action.familyActivitySelectionId },
          'focusblocks current-state reconcile',
        );
        break;
      case 'clearWebContentFilterPolicy':
        webDomains.clear();
        break;
      case 'addWebContentFilterDomains':
        for (const domain of action.domains) webDomains.add(domain);
        break;
    }
  }
  DeviceActivity.clearWebContentFilterPolicy(
    'focusblocks current-state reconcile',
  );
  if (webDomains.size > 0) {
    DeviceActivity.setWebContentFilterPolicy(
      { type: 'specific', domains: [...webDomains].sort() },
      'focusblocks current-state reconcile',
    );
  }
}

export async function reconcileRuntimePlatform(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
  at: Date,
): Promise<void> {
  assertRuntimeCapacity(blocks, setupBlock);
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
  await reconcileMonitoringPlans(desired);
  applyCurrentState(blocks, at);
}
