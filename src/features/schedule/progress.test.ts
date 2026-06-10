import { describe, expect, it } from 'vitest';
import { buildFocusProgress } from './progress';
import type { FocusBlock } from './types';

function block(overrides: Partial<FocusBlock> = {}): FocusBlock {
  return {
    id: 'block',
    name: 'Block',
    startTime: '09:00',
    endTime: '10:00',
    days: ['mon', 'tue', 'wed'],
    isEnabled: true,
    enabledDeviceIds: ['device-a'],
    scope: { kind: 'allDevices' },
    rule: { kind: 'blockDuringSchedule' },
    selection: {
      activitySelection: {
        status: 'saved',
        applicationCount: 2,
        categoryCount: 1,
        webDomainCount: 1,
        includeEntireCategory: true,
      },
      webDomains: ['youtube.com'],
    },
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: false,
    ...overrides,
  };
}

describe('buildFocusProgress', () => {
  it('summarizes protected targets and configured safeguards', () => {
    const summary = buildFocusProgress(
      [
        block({ strict: true }),
        block({
          id: 'budget',
          rule: { kind: 'dailyBudget', minutes: 10 },
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
        }),
      ],
      new Date('2026-04-29T12:00:00'),
    );

    expect(summary).toEqual({
      activeBlockCount: 0,
      completedScheduledWindowCount: 3,
      enabledBlockCount: 2,
      protectedTargetCount: 6,
      strictBlockCount: 1,
    });
  });

  it('does not count disabled blocks as progress coverage', () => {
    const summary = buildFocusProgress(
      [block({ isEnabled: false })],
      new Date('2026-04-29T12:00:00'),
    );

    expect(summary).toEqual({
      activeBlockCount: 0,
      completedScheduledWindowCount: 0,
      enabledBlockCount: 0,
      protectedTargetCount: 0,
      strictBlockCount: 0,
    });
  });
});
