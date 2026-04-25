import { isOvernightRange, minutesOf } from '../../shared/days';
import type { DayOfWeek } from './types';

interface FocusBlockInternal {
  readonly days: readonly DayOfWeek[];
  readonly startTime: string;
  readonly endTime: string;
  readonly isEnabled: boolean;
}

const DAY_BY_INDEX: readonly DayOfWeek[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

function minuteOfDay(at: Date): number {
  return at.getHours() * 60 + at.getMinutes();
}

export function isFocusBlockActiveAt(
  block: FocusBlockInternal,
  at: Date,
): boolean {
  if (!block.isEnabled) return false;

  const current = minuteOfDay(at);
  const start = minutesOf(block.startTime);
  const end = minutesOf(block.endTime);
  const today = DAY_BY_INDEX[at.getDay()];

  if (!isOvernightRange(block.startTime, block.endTime)) {
    if (!block.days.includes(today)) return false;
    return current >= start && current < end;
  }

  if (block.days.includes(today) && current >= start) return true;
  const yesterdayIndex = (at.getDay() + 6) % 7;
  const yesterday = DAY_BY_INDEX[yesterdayIndex];
  return block.days.includes(yesterday) && current < end;
}

interface NextBlock {
  readonly day: DayOfWeek;
  readonly at: Date;
}

export function nextStartAfter(
  block: FocusBlockInternal,
  at: Date,
): NextBlock | null {
  if (!block.isEnabled || block.days.length === 0) return null;

  const start = minutesOf(block.startTime);
  const current = minuteOfDay(at);
  const todayIndex = at.getDay();

  for (let offset = 0; offset < 7; offset++) {
    const idx = (todayIndex + offset) % 7;
    const dayKey = DAY_BY_INDEX[idx];
    if (!block.days.includes(dayKey)) continue;
    if (offset === 0 && current >= start) continue;

    const next = new Date(at);
    next.setDate(next.getDate() + offset);
    next.setHours(Math.floor(start / 60), start % 60, 0, 0);
    return { day: dayKey, at: next };
  }

  return null;
}
