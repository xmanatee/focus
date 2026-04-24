import type { DayOfWeek, ScheduleInput } from './types';

const DAY_OF_WEEK_VALUES: DayOfWeek[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

const TIME_OF_DAY_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isTimeOfDay(value: string): boolean {
  return TIME_OF_DAY_PATTERN.test(value);
}

function timeOfDayToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateScheduleInput(
  input: Omit<ScheduleInput, 'profileId'>,
): void {
  if (input.name.trim().length === 0) {
    throw new Error('Schedule name is required.');
  }

  if (!isTimeOfDay(input.startTime) || !isTimeOfDay(input.endTime)) {
    throw new Error('Times must use 24-hour HH:mm format.');
  }

  if (
    timeOfDayToMinutes(input.startTime) === timeOfDayToMinutes(input.endTime)
  ) {
    throw new Error('Start and end time must differ.');
  }

  if (input.days.length === 0) {
    throw new Error('Select at least one day.');
  }

  if (new Set(input.days).size !== input.days.length) {
    throw new Error('Schedule days must be unique.');
  }

  for (const day of input.days) {
    if (!DAY_OF_WEEK_VALUES.includes(day)) {
      throw new Error(`Invalid day: ${day}`);
    }
  }
}
