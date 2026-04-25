import { DAY_OF_WEEK_VALUES, type DayOfWeek } from '../features/schedule/types';

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

interface DayChoice {
  readonly label: string;
  readonly value: DayOfWeek;
}

export const DAYS: readonly DayChoice[] = DAY_OF_WEEK_VALUES.map((value) => ({
  label: DAY_LABELS[value],
  value,
}));

export const DAY_ORDER: Record<DayOfWeek, number> = Object.fromEntries(
  DAY_OF_WEEK_VALUES.map((value, index) => [value, index]),
) as Record<DayOfWeek, number>;

const IOS_WEEKDAY: Record<DayOfWeek, number> = {
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
  sat: 7,
};

export function iosWeekday(day: DayOfWeek): number {
  return IOS_WEEKDAY[day];
}

export function nextIosWeekday(weekday: number): number {
  return (weekday % 7) + 1;
}

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function validateDays(days: readonly DayOfWeek[]): void {
  if (days.length === 0) {
    throw new Error('Pick at least one day.');
  }
  if (new Set(days).size !== days.length) {
    throw new Error('Days must be unique.');
  }
  for (const day of days) {
    if (!DAY_OF_WEEK_VALUES.includes(day)) {
      throw new Error(`Invalid day: ${day}`);
    }
  }
}

export function validateTimeRange(startTime: string, endTime: string): void {
  if (
    !TIME_OF_DAY_PATTERN.test(startTime) ||
    !TIME_OF_DAY_PATTERN.test(endTime)
  ) {
    throw new Error('Times must use 24-hour HH:mm format.');
  }
  if (minutesOf(endTime) === minutesOf(startTime)) {
    throw new Error('End time must differ from start time.');
  }
}

export function isOvernightRange(startTime: string, endTime: string): boolean {
  return minutesOf(endTime) < minutesOf(startTime);
}

export function rangeDurationMinutes(
  startTime: string,
  endTime: string,
): number {
  const diff = minutesOf(endTime) - minutesOf(startTime);
  return diff > 0 ? diff : diff + 24 * 60;
}

export function timeStringToDate(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function nextOccurrenceOf(time: string, after: Date): Date {
  const [h, m] = time.split(':').map(Number);
  const at = new Date(after);
  at.setHours(h, m, 0, 0);
  if (at <= after) {
    at.setDate(at.getDate() + 1);
  }
  return at;
}

export function formatRelative(at: Date, now: Date): string {
  const deltaMin = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (deltaMin < 60) {
    return `in ${Math.max(1, deltaMin)} min`;
  }
  const hours = Math.round(deltaMin / 60);
  if (hours < 24) {
    return `in ${hours} hr`;
  }
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

export function formatActiveDays(days: readonly DayOfWeek[]): string {
  if (days.length === 0) {
    return '';
  }

  const sorted = [...days].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]);
  if (sorted.length === 7) {
    return 'Every day';
  }

  const labels: string[] = [];
  let rangeStart = sorted[0];
  let previous = sorted[0];

  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i];
    if (DAY_ORDER[current] === DAY_ORDER[previous] + 1) {
      previous = current;
      continue;
    }

    labels.push(
      rangeStart === previous
        ? DAY_LABELS[rangeStart]
        : `${DAY_LABELS[rangeStart]}–${DAY_LABELS[previous]}`,
    );
    rangeStart = current;
    previous = current;
  }

  labels.push(
    rangeStart === previous
      ? DAY_LABELS[rangeStart]
      : `${DAY_LABELS[rangeStart]}–${DAY_LABELS[previous]}`,
  );

  return labels.join(', ');
}
