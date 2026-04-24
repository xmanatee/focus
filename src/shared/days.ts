import type { DayOfWeek } from '../features/schedule/types';

interface DayChoice {
  readonly label: string;
  readonly value: DayOfWeek;
}

export const DAYS: readonly DayChoice[] = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
] as const;

export const DAY_ORDER: Record<DayOfWeek, number> = DAYS.reduce(
  (acc, day, index) => {
    acc[day.value] = index;
    return acc;
  },
  {} as Record<DayOfWeek, number>,
);

export function timeStringToDate(value: string): Date {
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date;
}

export function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDayShort(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
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
