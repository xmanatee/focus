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
    return block.days.flatMap((day) => {
      const startWeekday = iosWeekday(day);
      return (['start', 'end'] as const).flatMap((boundary) => {
        const isStart = boundary === 'start';
        if (!(isStart ? block.notifyOnStart : block.notifyOnEnd)) return [];
        const time = minutesOf(isStart ? block.startTime : block.endTime);
        return [
          {
            ...scheduleNotification(block, boundary),
            hour: Math.floor(time / 60),
            id: `focusblocks.block.${block.id}.${day}.${boundary}`,
            minute: time % 60,
            weekday:
              !isStart && isOvernightRange(block.startTime, block.endTime)
                ? nextIosWeekday(startWeekday)
                : startWeekday,
          },
        ];
      });
    });
  });
  if (setupBlock === null || !setupBlock.notifyOnStart) return blockEntries;
  const startMinute = minutesOf(setupBlock.startTime);
  return [
    ...blockEntries,
    ...setupBlock.days.map((day) => ({
      body: 'You can now edit your focus blocks.',
      hour: Math.floor(startMinute / 60),
      id: `focusblocks.setup.${day}.start`,
      minute: startMinute % 60,
      title: 'Setup Block Active',
      weekday: iosWeekday(day),
    })),
  ];
}
