import {
  rangeDurationMinutes,
  validateDays,
  validateTimeRange,
} from '../../shared/days';
import type { DayOfWeek } from '../schedule/types';

const MIN_SETUP_WINDOW_MINUTES = 15;

interface SetupBlockInput {
  readonly days: readonly DayOfWeek[];
  readonly startTime: string;
  readonly endTime: string;
}

export function validateSetupBlock(input: SetupBlockInput): void {
  validateDays(input.days);
  validateTimeRange(input.startTime, input.endTime);

  const dailyMinutes = rangeDurationMinutes(input.startTime, input.endTime);
  if (dailyMinutes < MIN_SETUP_WINDOW_MINUTES) {
    throw new Error(
      `Setup block must allow at least ${MIN_SETUP_WINDOW_MINUTES} minutes.`,
    );
  }
}
