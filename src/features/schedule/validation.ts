import { TIME_OF_DAY_PATTERN, minutesOf } from '../../shared/days';
import { DAY_OF_WEEK_VALUES, type FocusBlockInput } from './types';

export function validateFocusBlockInput(input: FocusBlockInput): void {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new Error('Block name is required.');
  }

  if (name.length > 50) {
    throw new Error('Block name is too long.');
  }

  if (input.days.length === 0) {
    throw new Error('Pick at least one day for this block.');
  }

  if (new Set(input.days).size !== input.days.length) {
    throw new Error('Block days must be unique.');
  }

  for (const day of input.days) {
    if (!DAY_OF_WEEK_VALUES.includes(day)) {
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
    throw new Error('Start and end must differ.');
  }
}
