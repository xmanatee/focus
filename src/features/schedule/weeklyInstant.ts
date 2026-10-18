import { isOvernightRange, minutesOf, previousDay } from '../../shared/days';
import type { DayOfWeek, RuntimeFocusBlock } from './types';

type ScheduledBlock = Pick<
  RuntimeFocusBlock,
  'days' | 'startTime' | 'endTime' | 'rule' | 'isEnabled'
>;

export function scheduleTimeComponents(time: string): {
  readonly hour: number;
  readonly minute: number;
} {
  const [hour, minute] = time.split(':').map(Number);
  return { hour, minute };
}

export function isInsideScheduleAtWeeklyInstant(
  block: Pick<ScheduledBlock, 'days' | 'startTime' | 'endTime'>,
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
  block: ScheduledBlock,
  day: DayOfWeek,
  minute: number,
): boolean {
  if (!block.isEnabled || block.rule.kind === 'dailyBudget') return false;

  const isInsideWindow = isInsideScheduleAtWeeklyInstant(block, day, minute);
  return block.rule.kind === 'blockDuringSchedule'
    ? isInsideWindow
    : !isInsideWindow;
}
