import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import type { SetupBlock } from '../features/settings/adminState';
import { androidBlockerNativeModule } from './AndroidBlockerNative';
import { androidNotificationPlan } from './androidNotificationPlan';

const IDENTIFIERS_KEY = 'focusblocks.androidNotificationIdentifiers';

export async function reconcileAndroidNotifications(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
): Promise<void> {
  const previous = JSON.parse(
    (await AsyncStorage.getItem(IDENTIFIERS_KEY)) ?? '[]',
  ) as unknown;
  if (!Array.isArray(previous) || !previous.every(isString)) {
    throw new Error('Stored Android notification identifiers are invalid.');
  }
  await Promise.all(
    previous.map((identifier) =>
      Notifications.cancelScheduledNotificationAsync(identifier),
    ),
  );
  await AsyncStorage.setItem(IDENTIFIERS_KEY, '[]');

  const channelId = androidBlockerNativeModule().scheduleNotificationChannelId;
  const identifiers: string[] = [];
  try {
    for (const entry of androidNotificationPlan(blocks, setupBlock)) {
      identifiers.push(
        await Notifications.scheduleNotificationAsync({
          content: {
            body: entry.body,
            data: { focusNotificationId: entry.id },
            title: entry.title,
          },
          trigger: {
            channelId,
            hour: entry.hour,
            minute: entry.minute,
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: entry.weekday,
          },
        }),
      );
    }
  } catch (error) {
    await Promise.all(
      identifiers.map((identifier) =>
        Notifications.cancelScheduledNotificationAsync(identifier),
      ),
    );
    throw error;
  }
  await AsyncStorage.setItem(IDENTIFIERS_KEY, JSON.stringify(identifiers));
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
