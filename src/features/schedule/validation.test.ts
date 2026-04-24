import { describe, expect, it } from 'vitest';
import type { DayOfWeek, ScheduleInput } from './types';
import { validateScheduleInput } from './validation';

function baseInput(overrides: Partial<ScheduleInput> = {}): ScheduleInput {
  const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
  return {
    name: 'Work',
    startTime: '09:00',
    endTime: '17:00',
    days: weekdays,
    isEnabled: true,
    ...overrides,
  };
}

describe('validateScheduleInput', () => {
  it('accepts a valid weekday schedule', () => {
    expect(() => validateScheduleInput(baseInput())).not.toThrow();
  });

  it('accepts a single-day schedule', () => {
    expect(() =>
      validateScheduleInput(baseInput({ days: ['sun'] })),
    ).not.toThrow();
  });

  it('accepts a cross-midnight window (start later than end)', () => {
    expect(() =>
      validateScheduleInput(
        baseInput({ startTime: '22:00', endTime: '06:00' }),
      ),
    ).not.toThrow();
  });

  it('rejects an empty name', () => {
    expect(() => validateScheduleInput(baseInput({ name: '   ' }))).toThrow(
      /name is required/i,
    );
  });

  it.each([
    ['24:00', '17:00'],
    ['09:00', '9:00'],
    ['0900', '1700'],
    ['09:60', '17:00'],
  ])('rejects malformed times %s - %s', (startTime, endTime) => {
    expect(() =>
      validateScheduleInput(baseInput({ startTime, endTime })),
    ).toThrow(/HH:mm/i);
  });

  it('rejects identical start and end time', () => {
    expect(() =>
      validateScheduleInput(
        baseInput({ startTime: '09:00', endTime: '09:00' }),
      ),
    ).toThrow(/must differ/i);
  });

  it('rejects an empty day list', () => {
    expect(() => validateScheduleInput(baseInput({ days: [] }))).toThrow(
      /at least one day/i,
    );
  });

  it('rejects duplicate days', () => {
    expect(() =>
      validateScheduleInput(baseInput({ days: ['mon', 'mon'] })),
    ).toThrow(/unique/i);
  });
});
