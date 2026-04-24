import type { BlockSelection } from '../blocker/types';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  days: DayOfWeek[];
  isEnabled: boolean;
  selection: BlockSelection;
}

export interface ScheduleInput {
  name: string;
  startTime: string;
  endTime: string;
  days: DayOfWeek[];
  isEnabled: boolean;
  selection: BlockSelection;
}
