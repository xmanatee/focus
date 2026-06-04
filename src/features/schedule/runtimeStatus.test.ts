import { beforeEach, describe, expect, it } from 'vitest';
import {
  eventRecords,
  resetDeviceActivityMock,
} from '../../test-helpers/mockDeviceActivity';
import { getFocusBlockRuntimeStatus } from './runtimeStatus';
import type { FocusBlock } from './types';

function block(overrides: Partial<FocusBlock> = {}): FocusBlock {
  return {
    id: 'block',
    name: 'Block',
    startTime: '09:00',
    endTime: '17:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    isEnabled: true,
    scope: { kind: 'allDevices' },
    rule: { kind: 'blockDuringSchedule' },
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

function at(value: string): Date {
  return new Date(value);
}

function expectTime(value: Date, hour: number, minute: number): void {
  expect(value.getHours()).toBe(hour);
  expect(value.getMinutes()).toBe(minute);
}

describe('getFocusBlockRuntimeStatus', () => {
  beforeEach(() => {
    resetDeviceActivityMock();
  });

  it('reports scheduled blocks until their end time', () => {
    const status = getFocusBlockRuntimeStatus(
      block(),
      at('2026-04-27T10:00:00'),
    );

    expect(status.kind).toBe('active');
    if (status.kind === 'active') {
      expect(status.reason).toBe('scheduled');
      expectTime(status.endsAt, 17, 0);
    }
  });

  it('reports allow-only blocks as active until the next allowed start', () => {
    const status = getFocusBlockRuntimeStatus(
      block({ rule: { kind: 'allowDuringSchedule' } }),
      at('2026-04-27T08:00:00'),
    );

    expect(status.kind).toBe('active');
    if (status.kind === 'active') {
      expect(status.reason).toBe('outsideSchedule');
      expectTime(status.endsAt, 9, 0);
    }
  });

  it('reports allow-only blocks as inactive inside the allowed window', () => {
    const status = getFocusBlockRuntimeStatus(
      block({ rule: { kind: 'allowDuringSchedule' } }),
      at('2026-04-27T10:00:00'),
    );

    expect(status.kind).toBe('inactive');
  });

  it('reports daily budgets as active only after the threshold fired in the current interval', () => {
    eventRecords.push(
      {
        activityName: 'focusblocks.budget.block.mon',
        callbackName: 'intervalDidStart',
        lastCalledAt: 100,
      },
      {
        activityName: 'focusblocks.budget.block.mon',
        callbackName: 'eventDidReachThreshold',
        eventName: 'limit',
        lastCalledAt: 200,
      },
    );

    const status = getFocusBlockRuntimeStatus(
      block({ rule: { kind: 'dailyBudget', minutes: 10 } }),
      at('2026-04-27T10:00:00'),
    );

    expect(status.kind).toBe('active');
    if (status.kind === 'active') {
      expect(status.reason).toBe('budget');
      expectTime(status.endsAt, 0, 0);
    }
  });

  it('ignores stale budget thresholds from before the current interval start', () => {
    eventRecords.push(
      {
        activityName: 'focusblocks.budget.block.mon',
        callbackName: 'intervalDidStart',
        lastCalledAt: 200,
      },
      {
        activityName: 'focusblocks.budget.block.mon',
        callbackName: 'eventDidReachThreshold',
        eventName: 'limit',
        lastCalledAt: 100,
      },
    );

    const status = getFocusBlockRuntimeStatus(
      block({ rule: { kind: 'dailyBudget', minutes: 10 } }),
      at('2026-04-27T10:00:00'),
    );

    expect(status.kind).toBe('inactive');
  });

  it('reports schedule plus budget as locked until the next schedule start after the budget is used', () => {
    eventRecords.push(
      {
        activityName: 'focusblocks.budget.block.mon',
        callbackName: 'intervalDidStart',
        lastCalledAt: 100,
      },
      {
        activityName: 'focusblocks.budget.block.mon',
        callbackName: 'eventDidReachThreshold',
        eventName: 'limit',
        lastCalledAt: 200,
      },
    );

    const status = getFocusBlockRuntimeStatus(
      block({ rule: { kind: 'allowDuringScheduleWithBudget', minutes: 10 } }),
      at('2026-04-27T10:00:00'),
    );

    expect(status.kind).toBe('active');
    if (status.kind === 'active') {
      expect(status.reason).toBe('budget');
      expect(status.endsAt.getDay()).toBe(2);
      expectTime(status.endsAt, 9, 0);
    }
  });
});
