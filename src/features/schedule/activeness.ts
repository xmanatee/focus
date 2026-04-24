import type { DayOfWeek } from './types';

interface ScheduleWindow {
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

export function isScheduleActiveAt(
  schedule: ScheduleWindow,
  at: Date,
): boolean {
  if (!schedule.isEnabled) {
    return false;
  }

  const todayIndex = at.getDay();
  const todayKey = DAY_BY_INDEX[todayIndex];
  const yesterdayKey = DAY_BY_INDEX[(todayIndex + 6) % 7];
  const current = minuteOfDay(at);
  const start = minutesOf(schedule.startTime);
  const end = minutesOf(schedule.endTime);

  if (spansMidnight(schedule.startTime, schedule.endTime)) {
    if (schedule.days.includes(todayKey) && current >= start) {
      return true;
    }
    if (schedule.days.includes(yesterdayKey) && current < end) {
      return true;
    }
    return false;
  }

  return schedule.days.includes(todayKey) && current >= start && current < end;
}

interface NextWindow {
  readonly day: DayOfWeek;
  readonly at: Date;
}

export function nextStartAfter(
  schedule: ScheduleWindow,
  at: Date,
): NextWindow | null {
  if (!schedule.isEnabled || schedule.days.length === 0) {
    return null;
  }

  const start = minutesOf(schedule.startTime);
  const current = minuteOfDay(at);
  const todayIndex = at.getDay();

  for (let offset = 0; offset < 7; offset++) {
    const idx = (todayIndex + offset) % 7;
    const dayKey = DAY_BY_INDEX[idx];
    if (!schedule.days.includes(dayKey)) {
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
