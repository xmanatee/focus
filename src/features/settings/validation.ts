import { TIME_OF_DAY_PATTERN, minutesOf } from '../../shared/days';
import { DAY_OF_WEEK_VALUES, type DayOfWeek } from '../schedule/types';

const MIN_SETUP_MINUTES_PER_WEEK = 15;

function blockMinutes(startTime: string, endTime: string): number {
  const start = minutesOf(startTime);
  const end = minutesOf(endTime);
  const minutesInDay = 24 * 60;
  return end > start ? end - start : minutesInDay - start + end;
}

interface SetupBlockInput {
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
