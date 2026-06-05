import { isOvernightRange, minutesOf } from '../../shared/days';
import { getActiveBlockStatuses } from './activeBlocks';
import type { DayOfWeek, FocusBlock } from './types';

export interface FocusProgress {
  readonly activeBlockCount: number;
  readonly completedScheduledWindowCount: number;
  readonly enabledBlockCount: number;
  readonly protectedTargetCount: number;
  readonly strictBlockCount: number;
}

const DAY_BY_DATE_INDEX: readonly DayOfWeek[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

function hasScheduledWindow(block: FocusBlock): boolean {
  return (
    block.rule.kind === 'blockDuringSchedule' ||
    block.rule.kind === 'allowDuringSchedule' ||
    block.rule.kind === 'allowDuringScheduleWithBudget'
  );
}

function targetCount(block: FocusBlock): number {
  const activity = block.selection.activitySelection;
  const nativeTargets =
    activity.status === 'saved'
      ? activity.applicationCount +
        activity.categoryCount +
        activity.webDomainCount
      : 0;
  return nativeTargets + block.selection.webDomains.length;
}

function dayStart(at: Date): Date {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateWithMinutes(day: Date, minuteOfDay: number): Date {
  const date = new Date(day);
  date.setHours(Math.floor(minuteOfDay / 60), minuteOfDay % 60, 0, 0);
  return date;
}

function completedScheduledWindows(block: FocusBlock, now: Date): number {
  if (!block.isEnabled || !hasScheduledWindow(block)) return 0;

  let count = 0;
  const today = dayStart(now);
  const startMinute = minutesOf(block.startTime);
  const endMinute = minutesOf(block.endTime);

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const blockDay = DAY_BY_DATE_INDEX[day.getDay()];
    if (!block.days.includes(blockDay)) continue;

    const endDate = dateWithMinutes(day, endMinute);
    if (isOvernightRange(block.startTime, block.endTime)) {
      endDate.setDate(endDate.getDate() + 1);
    }
    const startDate = dateWithMinutes(day, startMinute);
    if (startDate < now && endDate <= now) count += 1;
  }

  return count;
}

export function buildFocusProgress(
  blocks: readonly FocusBlock[],
  now: Date,
): FocusProgress {
  const enabled = blocks.filter((block) => block.isEnabled);
  return {
    activeBlockCount: getActiveBlockStatuses(enabled, now).length,
    completedScheduledWindowCount: enabled.reduce(
      (total, block) => total + completedScheduledWindows(block, now),
      0,
    ),
    enabledBlockCount: enabled.length,
    protectedTargetCount: enabled.reduce(
      (total, block) => total + targetCount(block),
      0,
    ),
    strictBlockCount: enabled.filter((block) => block.strict).length,
  };
}
