import { beforeEach, describe, expect, it } from 'vitest';
import {
  deferNextMonitoringStart,
  manualActions,
  monitoringCalls,
  resetDeviceActivityMock,
  slotStore,
} from '../../test-helpers/mockDeviceActivity';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import {
  configuredActionsFor,
  runtimeBlock,
  savedSelection,
} from '../../test-helpers/schedulerFixtures';
import { reconcileFocusBlocks } from './scheduler';

describe('reconcileFocusBlocks', () => {
  beforeEach(() => {
    resetDeviceActivityMock();
    storageMap.clear();
  });

  it('recomputes the full active shield state at overlapping boundaries', async () => {
    slotStore.set('block.a', 'selection-a');
    slotStore.set('block.b', 'selection-b');

    await reconcileFocusBlocks(
      [
        runtimeBlock({
          id: 'a',
          name: 'A',
          startTime: '09:00',
          endTime: '11:00',
          selection: savedSelection(['a.example']),
        }),
        runtimeBlock({
          id: 'b',
          name: 'B',
          startTime: '10:00',
          endTime: '12:00',
          selection: savedSelection(['b.example']),
        }),
      ],
      null,
    );

    expect(
      configuredActionsFor('focusblocks.block.b.mon', 'intervalDidStart').map(
        (action) => action.type,
      ),
    ).toEqual([
      'resetBlocks',
      'clearWebContentFilterPolicy',
      'blockSelection',
      'addWebContentFilterDomains',
      'blockSelection',
      'addWebContentFilterDomains',
    ]);

    expect(
      configuredActionsFor('focusblocks.block.a.mon', 'intervalDidEnd').map(
        (action) => action.type,
      ),
    ).toEqual([
      'resetBlocks',
      'clearWebContentFilterPolicy',
      'blockSelection',
      'addWebContentFilterDomains',
    ]);
  });

  it('does not configure app block actions when synced metadata has no local selection slot', async () => {
    await reconcileFocusBlocks([runtimeBlock({ id: 'synced' })], null);

    expect(
      configuredActionsFor(
        'focusblocks.block.synced.mon',
        'intervalDidStart',
      ).map((action) => action.type),
    ).toEqual(['resetBlocks', 'clearWebContentFilterPolicy']);
  });

  it('configures app block actions when the local selection slot exists', async () => {
    slotStore.set('block.local', 'selection-local');

    await reconcileFocusBlocks([runtimeBlock({ id: 'local' })], null);

    expect(
      configuredActionsFor(
        'focusblocks.block.local.mon',
        'intervalDidStart',
      ).map((action) => action.type),
    ).toEqual(['resetBlocks', 'clearWebContentFilterPolicy', 'blockSelection']);
  });

  it('applies an active scheduled app block immediately during reconcile', async () => {
    slotStore.set('block.local', 'selection-local');

    await reconcileFocusBlocks(
      [runtimeBlock({ id: 'local' })],
      null,
      new Date('2026-04-27T10:00:00'),
    );

    expect(manualActions.map((action) => action.type)).toEqual([
      'resetBlocks',
      'blockSelection',
      'clearWebContentFilterPolicy',
    ]);
  });

  it('keeps unchanged native monitors instead of restarting them', async () => {
    const focusBlock = runtimeBlock({ id: 'stable' });

    await reconcileFocusBlocks([focusBlock], null);
    await reconcileFocusBlocks([focusBlock], null);

    expect(monitoringCalls).toHaveLength(1);
  });

  it('replaces a native monitor when its plan changes', async () => {
    await reconcileFocusBlocks([runtimeBlock({ id: 'changed' })], null);
    await reconcileFocusBlocks(
      [runtimeBlock({ id: 'changed', endTime: '18:00' })],
      null,
    );

    expect(monitoringCalls).toHaveLength(2);
    expect(monitoringCalls[1]?.schedule).toEqual(
      expect.objectContaining({
        intervalEnd: { hour: 18, minute: 0, weekday: 2 },
      }),
    );
  });

  it('serializes concurrent reconciliations so the newest state wins', async () => {
    slotStore.set('block.first', 'selection-first');
    slotStore.set('block.latest', 'selection-latest');
    const releaseFirst = deferNextMonitoringStart();

    const first = reconcileFocusBlocks(
      [runtimeBlock({ id: 'first' })],
      null,
      new Date('2026-04-27T10:00:00'),
    );
    await Promise.resolve();

    const latest = reconcileFocusBlocks(
      [runtimeBlock({ id: 'latest' })],
      null,
      new Date('2026-04-27T10:00:00'),
    );
    releaseFirst();
    await Promise.all([first, latest]);

    const appliedSelections = manualActions.filter(
      (action) => action.type === 'blockSelection',
    );
    expect(appliedSelections.at(-1)?.payload).toEqual({
      payload: { activitySelectionId: 'block.latest' },
      triggeredBy: 'focusblocks current-state reconcile',
    });
  });
});
