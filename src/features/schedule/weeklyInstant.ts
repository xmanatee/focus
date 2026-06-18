import { isOvernightRange, minutesOf } from '../../shared/days';
import type { DayOfWeek, FocusBlock, RuntimeFocusBlock } from './types';

function previousDay(day: DayOfWeek): DayOfWeek {
  const dayOrder: readonly DayOfWeek[] = [
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ];
  const index = dayOrder.indexOf(day);
  return dayOrder[(index + 6) % 7];
}

export function scheduleTimeComponents(time: string): {
  readonly hour: number;
  readonly minute: number;
} {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

function isInsideScheduleAtWeeklyInstant(
  block: FocusBlock,
  day: DayOfWeek,
  minute: number,
): boolean {
  const start = minutesOf(block.startTime);
  const end = minutesOf(block.endTime);

  if (!isOvernightRange(block.startTime, block.endTime)) {
    return block.days.includes(day) && minute >= start && minute < end;
  }

  return (
    (block.days.includes(day) && minute >= start) ||
    (block.days.includes(previousDay(day)) && minute < end)
  );
}

export function isActiveAtWeeklyInstant(
  block: RuntimeFocusBlock,
  day: DayOfWeek,
  minute: number,
): boolean {
  if (!block.isEnabled || block.rule.kind === 'dailyBudget') return false;

  const isInsideWindow = isInsideScheduleAtWeeklyInstant(block, day, minute);
  if (block.rule.kind === 'allowDuringSchedule') return !isInsideWindow;
  if (block.rule.kind === 'allowDuringScheduleWithBudget') {
    return !isInsideWindow;
  }
  return isInsideWindow;
}
