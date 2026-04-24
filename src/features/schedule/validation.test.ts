import { describe, expect, it } from 'vitest';
import { EMPTY_BLOCK_SELECTION } from '../blocker/types';
import type { DayOfWeek, FocusBlockInput } from './types';
import { validateFocusBlockInput } from './validation';

function baseInput(overrides: Partial<FocusBlockInput> = {}): FocusBlockInput {
  const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
  return {
    name: 'Work',
    startTime: '09:00',
    endTime: '17:00',
    days: weekdays,
    isEnabled: true,
    selection: EMPTY_BLOCK_SELECTION,
    ...overrides,
  };
}

describe('validateFocusBlockInput', () => {
  it('accepts a valid weekday block', () => {
    expect(() => validateFocusBlockInput(baseInput())).not.toThrow();
  });

  it('accepts a single-day block', () => {
    expect(() =>
      validateFocusBlockInput(baseInput({ days: ['sun'] })),
    ).not.toThrow();
  });

  it('accepts a cross-midnight block (start later than end)', () => {
    expect(() =>
      validateFocusBlockInput(
        baseInput({ startTime: '22:00', endTime: '06:00' }),
      ),
    ).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() => validateFocusBlockInput(baseInput({ name: '   ' }))).toThrow(
      /name/i,
    );
  });

  it('rejects identical start and end', () => {
    const startTime = '09:00';
    const endTime = '09:00';
    expect(() =>
      validateFocusBlockInput(baseInput({ startTime, endTime })),
    ).toThrow(/differ/i);
  });

  it('rejects empty days', () => {
    expect(() => validateFocusBlockInput(baseInput({ days: [] }))).toThrow(
      /at least one day/i,
    );
  });

  it('rejects duplicate days', () => {
    expect(() =>
      validateFocusBlockInput(baseInput({ days: ['mon', 'mon'] })),
    ).toThrow(/unique/i);
  });
});
