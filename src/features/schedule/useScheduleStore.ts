import { create } from 'zustand';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { convex } from '../../api/convex';
import type { CreateScheduleInput } from './types';

interface ScheduleActions {
  addSchedule: (input: CreateScheduleInput) => Promise<void>;
  toggleSchedule: (id: Id<'schedules'>, isEnabled: boolean) => Promise<void>;
  deleteSchedule: (id: Id<'schedules'>) => Promise<void>;
}

export const useScheduleStore = create<ScheduleActions>(() => ({
  addSchedule: async (input) => {
    await convex.mutation(api.schedules.create, input);
  },

  toggleSchedule: async (id, isEnabled) => {
    await convex.mutation(api.schedules.toggle, {
      id,
      isEnabled,
    });
  },

  deleteSchedule: async (id) => {
    await convex.mutation(api.schedules.remove, {
      id,
    });
  },
}));
