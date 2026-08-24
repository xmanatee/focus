import { beforeEach, describe, expect, it } from 'vitest';
import {
  eventRecords,
  manualActions,
  monitoringCalls,
  resetDeviceActivityMock,
  slotStore,
} from '../../test-helpers/mockDeviceActivity';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import {
  BUDGET_WEB_ACTIVITY,
  budgetWebBlock,
  configuredActionsFor,
  runtimeBlock,
} from '../../test-helpers/schedulerFixtures';
import { reconcileFocusBlocks } from './scheduler';

describe('budget monitor reconciliation', () => {
  beforeEach(() => {
    resetDeviceActivityMock();
    storageMap.clear();
  });

  it('configures daily budget monitors with past activity included', async () => {
    slotStore.set('block.budget', 'selection-budget');

    await reconcileFocusBlocks(
      [
        runtimeBlock({
          id: 'budget',
          rule: { kind: 'dailyBudget', minutes: 10 },
        }),
      ],
      null,
    );

    expect(monitoringCalls).toEqual([
      {
        activityName: 'focusblocks.budget.budget.mon',
        schedule: {
          intervalStart: { hour: 0, minute: 0, weekday: 2 },
          intervalEnd: { hour: 0, minute: 0, weekday: 3 },
          repeats: true,
          warningTime: { minute: 5 },
        },
        events: [
          {
            eventName: 'limit',
            familyActivitySelection: 'selection-budget',
            threshold: { minute: 10 },
            includesPastActivity: true,
          },
        ],
      },
    ]);

    expect(
      configuredActionsFor(
        'focusblocks.budget.budget.mon',
        'eventDidReachThreshold',
      ).map((action) => action.type),
    ).toEqual(['blockSelection']);

    expect(
      configuredActionsFor(
        'focusblocks.budget.budget.mon',
        'intervalDidEnd',
      ).map((action) => action.type),
    ).toEqual(['resetBlocks', 'clearWebContentFilterPolicy']);
  });

  it('configures a pre-limit warning notification for larger daily budgets', async () => {
    slotStore.set('block.budget', 'selection-budget');

    await reconcileFocusBlocks(
      [
        runtimeBlock({
          id: 'budget',
          rule: { kind: 'dailyBudget', minutes: 15 },
        }),
      ],
      null,
    );

    expect(monitoringCalls[0].schedule).toEqual(
      expect.objectContaining({ warningTime: { minute: 5 } }),
    );
    expect(
      configuredActionsFor(
        'focusblocks.budget.budget.mon',
        'eventWillReachThresholdWarning',
      ).map((action) => action.type),
    ).toEqual(['sendNotification']);
  });

  it('adds website domains when a budget threshold fires', async () => {
    slotStore.set('block.budget-web', 'selection-budget-web');

    await reconcileFocusBlocks(
      [budgetWebBlock(['youtube.com', 'm.youtube.com'])],
      null,
    );

    expect(
      configuredActionsFor(BUDGET_WEB_ACTIVITY, 'eventDidReachThreshold').map(
        (action) => action.type,
      ),
    ).toEqual(['blockSelection', 'addWebContentFilterDomains']);
  });

  it('reapplies budget website blocking during current-state reconcile', async () => {
    slotStore.set('block.budget-web', 'selection-budget-web');
    eventRecords.push(
      {
        activityName: BUDGET_WEB_ACTIVITY,
        callbackName: 'intervalDidStart',
        lastCalledAt: 100,
      },
      {
        activityName: BUDGET_WEB_ACTIVITY,
        callbackName: 'eventDidReachThreshold',
        eventName: 'limit',
        lastCalledAt: 200,
      },
    );

    await reconcileFocusBlocks(
      [budgetWebBlock()],
      null,
      new Date('2026-04-27T10:00:00'),
    );

    expect(manualActions.map((action) => action.type)).toEqual([
      'resetBlocks',
      'blockSelection',
      'clearWebContentFilterPolicy',
      'setWebContentFilterPolicy',
    ]);
    expect(manualActions[3]?.payload).toEqual({
      payload: { type: 'specific', domains: ['youtube.com'] },
      triggeredBy: 'focusblocks current-state reconcile',
    });
  });

  it('ignores a budget threshold without an interval start', async () => {
    slotStore.set('block.budget-web', 'selection-budget-web');
    eventRecords.push({
      activityName: BUDGET_WEB_ACTIVITY,
      callbackName: 'eventDidReachThreshold',
      eventName: 'limit',
      lastCalledAt: 200,
    });

    await reconcileFocusBlocks(
      [budgetWebBlock()],
      null,
      new Date('2026-04-27T10:00:00'),
    );

    expect(manualActions.map((action) => action.type)).toEqual([
      'resetBlocks',
      'clearWebContentFilterPolicy',
    ]);
  });
});
