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
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: DayOfWeek[];
  isEnabled: boolean;
  selection: BlockSelection;
  notifyOnStart: boolean;
  notifyOnEnd: boolean;
  strict: boolean;
}

export interface FocusBlockInput {
  name: string;
  startTime: string;
  endTime: string;
  days: DayOfWeek[];
  isEnabled: boolean;
  selection: BlockSelection;
  notifyOnStart: boolean;
  notifyOnEnd: boolean;
  strict: boolean;
}
