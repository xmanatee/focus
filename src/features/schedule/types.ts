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

export type FocusBlockScope =
  | { readonly kind: 'allDevices' }
  | { readonly kind: 'device'; readonly deviceId: string };

export type FocusBlockRule =
  | { readonly kind: 'blockDuringSchedule' }
  | { readonly kind: 'allowDuringSchedule' }
  | { readonly kind: 'dailyBudget'; readonly minutes: number }
  | {
      readonly kind: 'allowDuringScheduleWithBudget';
      readonly minutes: number;
    };

export interface FocusBlock {
  readonly id: string;
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly days: readonly DayOfWeek[];
  readonly isEnabled: boolean;
  readonly scope: FocusBlockScope;
  readonly rule: FocusBlockRule;
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
  readonly scope: FocusBlockScope;
  readonly rule: FocusBlockRule;
  readonly selection: BlockSelection;
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly strict: boolean;
}
