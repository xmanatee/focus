import type { BlockSelection } from '../blocker/types';

export const DAY_OF_WEEK_VALUES = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
] as const;

export type DayOfWeek = (typeof DAY_OF_WEEK_VALUES)[number];

export interface FocusBlock {
  readonly id: string;
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly days: readonly DayOfWeek[];
  readonly isEnabled: boolean;
  readonly selection: BlockSelection;
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly strict: boolean;
}

export interface FocusBlockInput {
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly days: readonly DayOfWeek[];
  readonly isEnabled: boolean;
  readonly selection: BlockSelection;
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly strict: boolean;
}
