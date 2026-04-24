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
  updateSchedule: (
    id: Id<'schedules'>,
    input: CreateScheduleInput,
  ) => Promise<void>;
  toggleSchedule: (id: Id<'schedules'>, isEnabled: boolean) => Promise<void>;
  deleteSchedule: (id: Id<'schedules'>) => Promise<void>;
  reconcile: (
    schedules: readonly Schedule[],
    selectionsById: Readonly<Record<string, BlockSelection>>,
  ) => Promise<void>;
}

async function requireSchedule(id: Id<'schedules'>): Promise<Schedule> {
  const schedules = await convex.query(api.schedules.get);
  const schedule = schedules.find((s) => s._id === id);
  if (!schedule) {
    throw new Error('Schedule not found.');
  }
  return schedule;
}

function refuseWhileActive(schedule: Schedule, message: string): void {
  if (isScheduleActiveAt(schedule, new Date())) {
    throw new Error(message);
  }
}

export const useScheduleStore = create<ScheduleActions>(() => ({
  addSchedule: async (input) => {
    await convex.mutation(api.schedules.create, input);
  },

  updateSchedule: async (id, input) => {
    const schedule = await requireSchedule(id);
    refuseWhileActive(
      schedule,
      'Cannot change a schedule while its window is active.',
    );
    await convex.mutation(api.schedules.update, {
      id,
      name: input.name,
      startTime: input.startTime,
      endTime: input.endTime,
      days: input.days,
      profileId: input.profileId,
    });
  },

  toggleSchedule: async (id, isEnabled) => {
    const schedule = await requireSchedule(id);
    refuseWhileActive(
      schedule,
      'Cannot change a schedule while its window is active.',
    );
    await convex.mutation(api.schedules.toggle, { id, isEnabled });
  },

  deleteSchedule: async (id) => {
    const schedule = await requireSchedule(id);
    refuseWhileActive(
      schedule,
      'Cannot delete a schedule while its window is active.',
    );
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
