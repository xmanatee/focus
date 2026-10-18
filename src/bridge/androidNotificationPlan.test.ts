import { describe, expect, it } from 'vitest';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import { runtimeBlock } from '../test-helpers/focusBlockFixtures';
import { androidNotificationPlan } from './androidNotificationPlan';

function block(overrides: Partial<RuntimeFocusBlock> = {}): RuntimeFocusBlock {
  return runtimeBlock({
    endTime: '10:00',
    id: 'work',
    name: 'Deep Work',
    notifyOnEnd: true,
    notifyOnStart: true,
    ...overrides,
  });
}

describe('androidNotificationPlan', () => {
  it('schedules start and end notifications for every enabled day', () => {
    const plan = androidNotificationPlan([block({ days: ['mon', 'wed'] })]);

    expect(
      plan.map(({ hour, minute, weekday }) => ({ hour, minute, weekday })),
    ).toEqual([
      { hour: 9, minute: 0, weekday: 2 },
      { hour: 10, minute: 0, weekday: 2 },
      { hour: 9, minute: 0, weekday: 4 },
      { hour: 10, minute: 0, weekday: 4 },
    ]);
  });

  it('moves an overnight end notification to the following weekday', () => {
    const plan = androidNotificationPlan([
      block({ endTime: '07:00', startTime: '22:00' }),
    ]);

    expect(plan[1]).toMatchObject({ hour: 7, weekday: 3 });
  });

  it('omits disabled and daily-budget blocks', () => {
    expect(
      androidNotificationPlan([
        block({ isEnabled: false }),
        block({ id: 'budget', rule: { kind: 'dailyBudget', minutes: 10 } }),
      ]),
    ).toEqual([]);
  });

  it.each(['allowDuringSchedule', 'allowDuringScheduleWithBudget'] as const)(
    'describes the allowed window accurately for %s',
    (kind) => {
      const plan = androidNotificationPlan([
        block({
          rule:
            kind === 'allowDuringSchedule' ? { kind } : { kind, minutes: 30 },
        }),
      ]);

      expect(plan[0]).toMatchObject({ title: 'App Window Open' });
      expect(plan[0].body).toContain('allows your selected apps');
      expect(plan[1]).toMatchObject({ title: 'App Window Closed' });
      expect(plan[1].body).toContain('blocks your selected apps');
    },
  );

  it('schedules the local setup-window reminder', () => {
    const plan = androidNotificationPlan([], {
      days: ['sun'],
      endTime: '11:00',
      notifyOnStart: true,
      startTime: '10:15',
    });

    expect(plan).toEqual([
      expect.objectContaining({
        hour: 10,
        id: 'focusblocks.setup.sun.start',
        minute: 15,
        weekday: 1,
      }),
    ]);
  });
});
