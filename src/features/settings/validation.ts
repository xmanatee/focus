import type { DayOfWeek } from '../schedule/types';

const DAY_OF_WEEK_VALUES: readonly DayOfWeek[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const MIN_SETUP_MINUTES_PER_WEEK = 15;

function minutesOf(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function blockMinutes(startTime: string, endTime: string): number {
  const start = minutesOf(startTime);
  const end = minutesOf(endTime);
  const minutesInDay = 24 * 60;
  return end > start ? end - start : minutesInDay - start + end;
}

export interface SetupBlockInput {
  readonly days: readonly string[];
  readonly startTime: string;
  readonly endTime: string;
}

export function validateSetupBlock(input: SetupBlockInput): void {
  if (input.days.length === 0) {
    throw new Error('Pick at least one day for the setup block.');
  }

  if (new Set(input.days).size !== input.days.length) {
    throw new Error('Setup block days must be unique.');
  }

  for (const day of input.days) {
    if (!DAY_OF_WEEK_VALUES.includes(day as DayOfWeek)) {
      throw new Error(`Invalid day: ${day}`);
    }
  }

  if (
    !TIME_OF_DAY_PATTERN.test(input.startTime) ||
    !TIME_OF_DAY_PATTERN.test(input.endTime)
  ) {
    throw new Error('Times must use 24-hour HH:mm format.');
  }

  if (minutesOf(input.startTime) === minutesOf(input.endTime)) {
    throw new Error('Setup block start and end must differ.');
  }

  const totalWeekMinutes =
    blockMinutes(input.startTime, input.endTime) * input.days.length;
  if (totalWeekMinutes < MIN_SETUP_MINUTES_PER_WEEK) {
    throw new Error(
      `Setup block must allow at least ${MIN_SETUP_MINUTES_PER_WEEK} minutes per week.`,
    );
  }
}
