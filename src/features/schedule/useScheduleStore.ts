import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { newId, persistedStorage } from '../../shared/storage';
import { EMPTY_BLOCK_SELECTION } from '../blocker/types';
import { isScheduleActiveAt } from './activeness';
import type { Schedule, ScheduleInput } from './types';

interface ScheduleState {
  schedules: Schedule[];
  addSchedule: (input: ScheduleInput) => void;
  updateSchedule: (id: string, input: ScheduleInput) => void;
  toggleSchedule: (id: string, isEnabled: boolean) => void;
  deleteSchedule: (id: string) => void;
  addPreset: (preset: 'deep-work' | 'evening' | 'weekend') => void;
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
              selection: input.selection,
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
                  selection: input.selection,
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

      addPreset: (kind) => {
        const presets: Record<string, ScheduleInput> = {
          'deep-work': {
            name: 'Deep Work',
            startTime: '09:00',
            endTime: '12:00',
            days: ['mon', 'tue', 'wed', 'thu', 'fri'],
            isEnabled: true,
            selection: EMPTY_BLOCK_SELECTION,
          },
          evening: {
            name: 'Evening Wind-down',
            startTime: '21:00',
            endTime: '23:30',
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            isEnabled: true,
            selection: EMPTY_BLOCK_SELECTION,
          },
          weekend: {
            name: 'Digital Detox',
            startTime: '08:00',
            endTime: '20:00',
            days: ['sat', 'sun'],
            isEnabled: true,
            selection: EMPTY_BLOCK_SELECTION,
          },
        };

        const input = presets[kind];
        if (input) {
          get().addSchedule(input);
        }
      },
    }),
    {
      name: 'fucus.schedules',
      storage: persistedStorage,
    },
  ),
);
