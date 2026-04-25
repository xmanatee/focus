import { validateDays, validateTimeRange } from '../../shared/days';
import type { FocusBlockInput } from './types';

const MAX_NAME_LENGTH = 50;

export function validateFocusBlockInput(input: FocusBlockInput): void {
  const name = input.name.trim();
  if (name.length === 0) {
    throw new Error('Block name is required.');
  }
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error('Block name is too long.');
  }
  validateDays(input.days);
  validateTimeRange(input.startTime, input.endTime);
}
