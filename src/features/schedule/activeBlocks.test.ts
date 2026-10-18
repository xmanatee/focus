import { beforeEach, describe, expect, it } from 'vitest';
import { runtimeBlock } from '../../test-helpers/focusBlockFixtures';
import {
  eventRecords,
  resetDeviceActivityMock,
} from '../../test-helpers/mockDeviceActivity';
import { getActiveBlockStatuses } from './activeBlocks';
import type { RuntimeFocusBlock } from './types';

function block(
  id: string,
  overrides: Partial<RuntimeFocusBlock> = {},
): RuntimeFocusBlock {
  return runtimeBlock({ id, name: id, ...overrides });
}

describe('getActiveBlockStatuses', () => {
  beforeEach(() => {
    resetDeviceActivityMock();
  });

  it('returns every active block instead of hiding overlaps behind the first one', () => {
    const statuses = getActiveBlockStatuses(
      [
        block('work'),
        block('budget', { rule: { kind: 'dailyBudget', minutes: 10 } }),
      ],
      new Date('2026-04-27T10:00:00'),
    );

    expect(statuses.map((status) => status.block.id)).toEqual(['work']);

    eventRecords.push(
      {
        activityName: 'focusblocks.budget.budget.mon',
        callbackName: 'intervalDidStart',
        lastCalledAt: 100,
      },
      {
        activityName: 'focusblocks.budget.budget.mon',
        callbackName: 'eventDidReachThreshold',
        eventName: 'limit',
        lastCalledAt: 200,
      },
    );

    const afterBudget = getActiveBlockStatuses(
      [
        block('work'),
        block('budget', { rule: { kind: 'dailyBudget', minutes: 10 } }),
      ],
      new Date('2026-04-27T10:00:00'),
    );

    expect(afterBudget.map((status) => status.block.id)).toEqual([
      'work',
      'budget',
    ]);
  });
});
