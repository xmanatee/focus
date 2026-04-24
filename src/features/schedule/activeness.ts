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

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minuteOfDay(at: Date): number {
  return at.getHours() * 60 + at.getMinutes();
}

function spansMidnight(startTime: string, endTime: string): boolean {
  return minutesOf(endTime) <= minutesOf(startTime);
}

export function isFocusBlockActiveAt(
  block: FocusBlockInternal,
  at: Date,
): boolean {
  if (!block.isEnabled) {
    return false;
  }

  const todayIndex = at.getDay();
  const todayKey = DAY_BY_INDEX[todayIndex];
  const yesterdayKey = DAY_BY_INDEX[(todayIndex + 6) % 7];
  const current = minuteOfDay(at);
  const start = minutesOf(block.startTime);
  const end = minutesOf(block.endTime);

  if (spansMidnight(block.startTime, block.endTime)) {
    if (block.days.includes(todayKey) && current >= start) {
      return true;
    }
    if (block.days.includes(yesterdayKey) && current < end) {
      return true;
    }
    return false;
  }

  return block.days.includes(todayKey) && current >= start && current < end;
}

interface NextBlock {
  readonly day: DayOfWeek;
  readonly at: Date;
}

export function nextStartAfter(
  block: FocusBlockInternal,
  at: Date,
): NextBlock | null {
  if (!block.isEnabled || block.days.length === 0) {
    return null;
  }

  const start = minutesOf(block.startTime);
  const current = minuteOfDay(at);
  const todayIndex = at.getDay();

  for (let offset = 0; offset < 7; offset++) {
    const idx = (todayIndex + offset) % 7;
    const dayKey = DAY_BY_INDEX[idx];
    if (!block.days.includes(dayKey)) {
      continue;
    }
    if (offset === 0 && current >= start) {
      continue;
    }
    const next = new Date(at);
    next.setDate(next.getDate() + offset);
    next.setHours(Math.floor(start / 60), start % 60, 0, 0);
    return { day: dayKey, at: next };
  }

  return null;
}
