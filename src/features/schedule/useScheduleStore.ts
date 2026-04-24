import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId, persistedStorage } from '../../shared/storage';
import { isScheduleActiveAt } from './activeness';
import type { Schedule, ScheduleInput } from './types';

interface ScheduleState {
  schedules: Schedule[];
  addSchedule: (input: ScheduleInput) => void;
  updateSchedule: (id: string, input: ScheduleInput) => void;
  toggleSchedule: (id: string, isEnabled: boolean) => void;
  deleteSchedule: (id: string) => void;
}

function assertNotActive(schedule: Schedule, message: string): void {
  if (isScheduleActiveAt(schedule, new Date())) {
    throw new Error(message);
  }
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],

      addSchedule: (input) =>
        set((state) => ({
          schedules: [
            ...state.schedules,
            {
              id: newId(),
              name: input.name.trim(),
              startTime: input.startTime,
              endTime: input.endTime,
              days: input.days,
              isEnabled: input.isEnabled,
            },
          ],
        })),

      updateSchedule: (id, input) => {
        const existing = get().schedules.find((s) => s.id === id);
        if (!existing) {
          throw new Error('Schedule not found.');
        }
        assertNotActive(
          existing,
          'Cannot change a schedule while its window is active.',
        );
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id
              ? {
                  ...s,
                  name: input.name.trim(),
                  startTime: input.startTime,
                  endTime: input.endTime,
                  days: input.days,
                }
              : s,
          ),
        }));
      },

      toggleSchedule: (id, isEnabled) => {
        const existing = get().schedules.find((s) => s.id === id);
        if (!existing) {
          throw new Error('Schedule not found.');
        }
        assertNotActive(
          existing,
          'Cannot change a schedule while its window is active.',
        );
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, isEnabled } : s,
          ),
        }));
      },

      deleteSchedule: (id) => {
        const existing = get().schedules.find((s) => s.id === id);
        if (existing) {
          assertNotActive(
            existing,
            'Cannot delete a schedule while its window is active.',
          );
        }
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        }));
      },
    }),
    {
      name: 'fucus.schedules',
      storage: persistedStorage,
    },
  ),
);
