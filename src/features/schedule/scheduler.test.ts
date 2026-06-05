import { beforeEach, describe, expect, it } from 'vitest';
import {
  configuredActions,
  monitoringCalls,
  resetDeviceActivityMock,
  slotStore,
} from '../../test-helpers/mockDeviceActivity';
import { reconcileFocusBlocks } from './scheduler';
import type { FocusBlock } from './types';

function block(overrides: Partial<FocusBlock>): FocusBlock {
  return {
    id: 'block',
    name: 'Block',
    startTime: '09:00',
    endTime: '17:00',
    days: ['mon'],
    isEnabled: true,
    selection: {
      activitySelection: {
        status: 'saved',
        applicationCount: 1,
        categoryCount: 0,
        webDomainCount: 0,
        includeEntireCategory: true,
      },
      webDomains: [],
    },
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: false,
    scope: { kind: 'allDevices' },
    rule: { kind: 'blockDuringSchedule' },
    ...overrides,
  };
}

function actionsFor(activityName: string, callbackName: string) {
  const config = configuredActions.find(
    (entry) =>
      entry.activityName === activityName &&
      entry.callbackName === callbackName,
  );
  expect(config).toBeDefined();
  return config?.actions ?? [];
}

describe('reconcileFocusBlocks', () => {
  beforeEach(() => {
    resetDeviceActivityMock();
  });

  it('recomputes the full active shield state at overlapping boundaries', async () => {
    slotStore.set('block.a', 'selection-a');
    slotStore.set('block.b', 'selection-b');

    await reconcileFocusBlocks(
      [
        block({
          id: 'a',
          name: 'A',
          startTime: '09:00',
          endTime: '11:00',
          selection: {
            activitySelection: {
              status: 'saved',
              applicationCount: 1,
              categoryCount: 0,
              webDomainCount: 0,
              includeEntireCategory: true,
            },
            webDomains: ['a.example'],
          },
        }),
        block({
          id: 'b',
          name: 'B',
          startTime: '10:00',
          endTime: '12:00',
          selection: {
            activitySelection: {
              status: 'saved',
              applicationCount: 1,
              categoryCount: 0,
              webDomainCount: 0,
              includeEntireCategory: true,
            },
            webDomains: ['b.example'],
          },
        }),
      ],
      null,
    );

    expect(
      actionsFor('focusblocks.block.b.mon', 'intervalDidStart').map(
        (action) => action.type,
      ),
    ).toEqual([
      'resetBlocks',
      'clearWebContentFilterPolicy',
      'blockSelection',
      'blockSelection',
      'setWebContentFilterPolicy',
    ]);

    expect(
      actionsFor('focusblocks.block.a.mon', 'intervalDidEnd').map(
        (action) => action.type,
      ),
    ).toEqual([
      'resetBlocks',
      'clearWebContentFilterPolicy',
      'blockSelection',
      'setWebContentFilterPolicy',
    ]);
  });

  it('does not configure app block actions when synced metadata has no local selection slot', async () => {
    await reconcileFocusBlocks([block({ id: 'synced' })], null);

    expect(
      actionsFor('focusblocks.block.synced.mon', 'intervalDidStart').map(
        (action) => action.type,
      ),
    ).toEqual(['resetBlocks', 'clearWebContentFilterPolicy']);
  });

  it('configures app block actions when the local selection slot exists', async () => {
    slotStore.set('block.local', 'selection-local');

    await reconcileFocusBlocks([block({ id: 'local' })], null);

    expect(
      actionsFor('focusblocks.block.local.mon', 'intervalDidStart').map(
        (action) => action.type,
      ),
    ).toEqual(['resetBlocks', 'clearWebContentFilterPolicy', 'blockSelection']);
  });

  it('configures daily budget monitors with past activity included', async () => {
    slotStore.set('block.budget', 'selection-budget');

    await reconcileFocusBlocks(
      [
        block({
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
      actionsFor('focusblocks.budget.budget.mon', 'eventDidReachThreshold').map(
        (action) => action.type,
      ),
    ).toEqual(['blockSelection']);

    expect(
      actionsFor('focusblocks.budget.budget.mon', 'intervalDidEnd').map(
        (action) => action.type,
      ),
    ).toEqual(['resetBlocks', 'clearWebContentFilterPolicy']);
  });

  it('configures a pre-limit warning notification for larger daily budgets', async () => {
    slotStore.set('block.budget', 'selection-budget');

    await reconcileFocusBlocks(
      [
        block({
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
      actionsFor(
        'focusblocks.budget.budget.mon',
        'eventWillReachThresholdWarning',
      ).map((action) => action.type),
    ).toEqual(['sendNotification']);
  });
});
