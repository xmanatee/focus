import type { Id } from '../../../convex/_generated/dataModel';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface CreateScheduleInput {
  name: string;
  startTime: string;
  endTime: string;
  days: DayOfWeek[];
  isEnabled: boolean;
  profileId: Id<'blockProfiles'>;
}
