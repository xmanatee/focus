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
    notifyOnStart: true,
    notifyOnEnd: true,
    strict: false,
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

  it('accepts a cross-midnight block', () => {
    expect(() =>
      validateFocusBlockInput(
        baseInput({ startTime: '22:00', endTime: '02:00' }),
      ),
    ).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() => validateFocusBlockInput(baseInput({ name: '   ' }))).toThrow(
      /name/i,
    );
  });

  it('rejects identical start and end', () => {
    const startTime = '22:00';
    const endTime = '22:00';
    expect(() =>
      validateFocusBlockInput(baseInput({ startTime, endTime })),
    ).toThrow(/differ/i);
  });

  it('accepts one-minute range', () => {
    expect(() =>
      validateFocusBlockInput(
        baseInput({ startTime: '22:00', endTime: '22:01' }),
      ),
    ).not.toThrow();
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

  it('rejects strict block without any blocked targets', () => {
    expect(() => validateFocusBlockInput(baseInput({ strict: true }))).toThrow(
      /strict block must block/i,
    );
  });

  it('accepts strict block when web domains are present', () => {
    expect(() =>
      validateFocusBlockInput(
        baseInput({
          strict: true,
          selection: { ...EMPTY_BLOCK_SELECTION, webDomains: ['example.com'] },
        }),
      ),
    ).not.toThrow();
  });
});
