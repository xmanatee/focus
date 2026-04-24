import { create } from 'zustand';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { convex } from '../../api/convex';
import type { BlockSelection } from '../blocker/types';
import { isScheduleActiveAt } from './activeness';
import { type ScheduleSpec, reconcileSchedules } from './scheduler';
import type { CreateScheduleInput } from './types';

export type Schedule = Doc<'schedules'>;

interface ScheduleActions {
  addSchedule: (input: CreateScheduleInput) => Promise<void>;
  toggleSchedule: (id: Id<'schedules'>, isEnabled: boolean) => Promise<void>;
  deleteSchedule: (id: Id<'schedules'>) => Promise<void>;
  reconcile: (
    schedules: readonly Schedule[],
    selectionsById: Readonly<Record<string, BlockSelection>>,
  ) => Promise<void>;
}

function ensureNotActive(
  schedule: Pick<Schedule, 'days' | 'startTime' | 'endTime' | 'isEnabled'>,
  at: Date,
  message: string,
): void {
  if (isScheduleActiveAt({ ...schedule }, at)) {
    throw new Error(message);
  }
}

export const useScheduleStore = create<ScheduleActions>(() => ({
  addSchedule: async (input) => {
    await convex.mutation(api.schedules.create, input);
  },

  toggleSchedule: async (id, isEnabled) => {
    const [schedule] = await convex
      .query(api.schedules.get)
      .then((all) => all.filter((s) => s._id === id));
    if (!schedule) {
      throw new Error('Schedule not found.');
    }
    ensureNotActive(
      schedule,
      new Date(),
      'Cannot change a schedule while its window is active.',
    );
    await convex.mutation(api.schedules.toggle, { id, isEnabled });
  },

  deleteSchedule: async (id) => {
    const [schedule] = await convex
      .query(api.schedules.get)
      .then((all) => all.filter((s) => s._id === id));
    if (schedule) {
      ensureNotActive(
        schedule,
        new Date(),
        'Cannot delete a schedule while its window is active.',
      );
    }
    await convex.mutation(api.schedules.remove, { id });
  },

  reconcile: async (schedules, selectionsById) => {
    const specs: ScheduleSpec[] = schedules.flatMap((schedule) => {
      const selection = selectionsById[schedule.profileId];
      if (!selection) {
        return [];
      }
      return [
        {
          id: schedule._id,
          days: schedule.days,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isEnabled: schedule.isEnabled,
          profileSelection: selection,
        },
      ];
    });
    await reconcileSchedules(specs);
  },
}));
