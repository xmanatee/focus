import { scheduleNotification } from '../features/schedule/scheduleNotification';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import type { SetupBlock } from '../features/settings/adminState';
import {
  iosWeekday,
  isOvernightRange,
  minutesOf,
  nextIosWeekday,
} from '../shared/days';

interface AndroidNotificationPlanEntry {
  readonly body: string;
  readonly hour: number;
  readonly id: string;
  readonly minute: number;
  readonly title: string;
  readonly weekday: number;
}

export function androidNotificationPlan(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null = null,
): readonly AndroidNotificationPlanEntry[] {
  const blockEntries = blocks.flatMap((block) => {
    if (!block.isEnabled || block.rule.kind === 'dailyBudget') return [];
    const startMinute = minutesOf(block.startTime);
    const endMinute = minutesOf(block.endTime);
    return block.days.flatMap((day) => {
      const startWeekday = iosWeekday(day);
      const endWeekday = isOvernightRange(block.startTime, block.endTime)
        ? nextIosWeekday(startWeekday)
        : startWeekday;
      return [
        ...(block.notifyOnStart
          ? [
              {
                ...scheduleNotification(block, 'start'),
                hour: Math.floor(startMinute / 60),
                id: `${block.id}.${day}.start`,
                minute: startMinute % 60,
                weekday: startWeekday,
              },
            ]
          : []),
        ...(block.notifyOnEnd
          ? [
              {
                ...scheduleNotification(block, 'end'),
                hour: Math.floor(endMinute / 60),
                id: `${block.id}.${day}.end`,
                minute: endMinute % 60,
                weekday: endWeekday,
              },
            ]
          : []),
      ];
    });
  });
  if (setupBlock === null || !setupBlock.notifyOnStart) return blockEntries;
  const startMinute = minutesOf(setupBlock.startTime);
  return [
    ...blockEntries,
    ...setupBlock.days.map((day) => ({
      body: 'You can now edit your focus blocks.',
      hour: Math.floor(startMinute / 60),
      id: `setup.${day}.start`,
      minute: startMinute % 60,
      title: 'Setup Block Active',
      weekday: iosWeekday(day),
    })),
  ];
}
