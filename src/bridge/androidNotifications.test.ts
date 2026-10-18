import type { NotificationRequestInput } from 'expo-notifications';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runtimeBlock } from '../test-helpers/focusBlockFixtures';
import { reconcileAndroidNotifications } from './androidNotifications';

const scheduler = vi.hoisted(() => ({
  pending: new Map<string, NotificationRequestInput>(),
  failAfter: Number.POSITIVE_INFINITY,
}));

vi.mock('./AndroidBlockerNative', () => ({
  androidBlockerNativeModule: () => ({
    scheduleNotificationChannelId: 'schedule',
  }),
}));

vi.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { WEEKLY: 'weekly' },
  cancelAllScheduledNotificationsAsync: async () => {
    scheduler.pending.clear();
  },
  scheduleNotificationAsync: async (request: NotificationRequestInput) => {
    if (scheduler.pending.size >= scheduler.failAfter)
      throw new Error('Scheduling failed.');
    if (request.identifier === undefined)
      throw new Error('A stable reminder identifier is required.');
    scheduler.pending.set(request.identifier, request);
    return request.identifier;
  },
}));

describe('Android schedule reminders', () => {
  beforeEach(() => {
    scheduler.pending.clear();
    scheduler.failAfter = Number.POSITIVE_INFINITY;
  });

  it('clears orphaned reminders even after the application lost its local state', async () => {
    scheduler.pending.set('orphan', {
      content: { title: 'Old schedule' },
      trigger: null,
    });
    await reconcileAndroidNotifications([], null);
    expect(scheduler.pending.size).toBe(0);
  });

  it('replaces reminders without duplicates and keeps setup and block identities separate', async () => {
    const blocks = [runtimeBlock({ id: 'setup', notifyOnStart: true })];
    const setup = {
      days: ['mon'] as const,
      startTime: '20:00',
      endTime: '21:00',
      notifyOnStart: true,
    };
    await reconcileAndroidNotifications(blocks, setup);
    await reconcileAndroidNotifications(blocks, setup);
    expect(
      [...scheduler.pending.values()].map((request) => request.content.title),
    ).toEqual(['Focus Block Started', 'Setup Block Active']);
    await reconcileAndroidNotifications([], null);
    expect(scheduler.pending.size).toBe(0);
  });

  it('reports a scheduling failure without leaving a partial set of reminders', async () => {
    scheduler.failAfter = 1;
    await expect(
      reconcileAndroidNotifications(
        [runtimeBlock({ notifyOnStart: true, notifyOnEnd: true })],
        null,
      ),
    ).rejects.toThrow('Scheduling failed.');
    expect(scheduler.pending.size).toBe(0);
  });
});
