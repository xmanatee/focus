import * as Notifications from 'expo-notifications';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import type { SetupBlock } from '../features/settings/adminState';
import { androidBlockerNativeModule } from './AndroidBlockerNative';
import { androidNotificationPlan } from './androidNotificationPlan';

export async function reconcileAndroidNotifications(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
): Promise<void> {
  const channelId = androidBlockerNativeModule().scheduleNotificationChannelId;
  await Notifications.cancelAllScheduledNotificationsAsync();
  try {
    for (const entry of androidNotificationPlan(blocks, setupBlock)) {
      await Notifications.scheduleNotificationAsync({
        identifier: entry.id,
        content: {
          body: entry.body,
          title: entry.title,
        },
        trigger: {
          channelId,
          hour: entry.hour,
          minute: entry.minute,
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: entry.weekday,
        },
      });
    }
  } catch (error) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    throw error;
  }
}
