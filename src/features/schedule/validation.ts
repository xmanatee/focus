import { BLOCK_ACTIVITY_SELECTION_ID } from '../blocker/constants';
import {
  hasSavedActivitySelection,
  selectionHasBlockedTargets,
} from '../blocker/types';
import type { CreateScheduleInput, DayOfWeek } from './types';

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

function isTimeOfDay(value: string) {
  return TIME_OF_DAY_PATTERN.test(value);
}

export function validateScheduleInput(input: CreateScheduleInput) {
  if (input.name.trim().length === 0) {
    throw new Error('Schedule name is required.');
  }

  if (!isTimeOfDay(input.startTime) || !isTimeOfDay(input.endTime)) {
    throw new Error('Times must use 24-hour HH:mm format.');
  }

  if (input.days.length === 0) {
    throw new Error('Select at least one day.');
  }

  const uniqueDays = new Set(input.days);
  if (uniqueDays.size !== input.days.length) {
    throw new Error('Schedule days must be unique.');
  }

  for (const day of input.days) {
    if (!DAY_OF_WEEK_VALUES.includes(day)) {
      throw new Error(`Invalid day: ${day}`);
    }
  }

  if (
    hasSavedActivitySelection(input.selection.activitySelection) &&
    input.selection.activitySelection.selectionId !==
      BLOCK_ACTIVITY_SELECTION_ID
  ) {
    throw new Error('Unsupported activity selection.');
  }

  if (!selectionHasBlockedTargets(input.selection)) {
    throw new Error('Pick at least one app or blocked website first.');
  }
}
