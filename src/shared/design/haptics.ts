import * as Haptics from 'expo-haptics';

export const haptic = {
  commit: (): Promise<void> =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
  select: (): Promise<void> => Haptics.selectionAsync(),
  complete: (): Promise<void> =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  abandon: (): Promise<void> =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
} as const;
