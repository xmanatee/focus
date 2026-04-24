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

export const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
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
