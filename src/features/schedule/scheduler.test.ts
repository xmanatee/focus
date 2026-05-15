import { beforeEach, describe, expect, it } from 'vitest';
import {
  configuredActions,
  resetDeviceActivityMock,
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
});
