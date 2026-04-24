import * as Haptics from 'expo-haptics';

export const haptic = {
  commit: (): Promise<void> =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),
  select: (): Promise<void> => Haptics.selectionAsync(),
  abandon: (): Promise<void> =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),
} as const;
