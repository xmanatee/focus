import { describe, expect, it } from 'vitest';
import type { DayOfWeek } from '../features/schedule/types';
import {
  formatActiveDays,
  iosWeekday,
  isOvernightRange,
  nextIosWeekday,
  rangeDurationMinutes,
  validateTimeRange,
} from './days';

describe('formatActiveDays', () => {
  it('formats weekdays as a range', () => {
    const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
    expect(formatActiveDays(days)).toBe('Mon–Fri');
  });

  it('formats weekend as a range', () => {
    const days: DayOfWeek[] = ['sat', 'sun'];
    expect(formatActiveDays(days)).toBe('Sat–Sun');
  });

  it('formats full week as every day', () => {
    const days: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    expect(formatActiveDays(days)).toBe('Every day');
  });

  it('formats a single day', () => {
    const days: DayOfWeek[] = ['mon'];
    expect(formatActiveDays(days)).toBe('Mon');
  });

  it('formats non-consecutive days individually', () => {
    const days: DayOfWeek[] = ['mon', 'wed', 'fri'];
    expect(formatActiveDays(days)).toBe('Mon, Wed, Fri');
  });

  it('formats mixed consecutive groups', () => {
    const days: DayOfWeek[] = ['mon', 'tue', 'thu', 'fri'];
    expect(formatActiveDays(days)).toBe('Mon–Tue, Thu–Fri');
  });

  it('formats empty input as empty string', () => {
    expect(formatActiveDays([])).toBe('');
  });
});

describe('iosWeekday', () => {
  it('maps each day to iOS weekday numbering', () => {
    expect(iosWeekday('sun')).toBe(1);
    expect(iosWeekday('mon')).toBe(2);
    expect(iosWeekday('tue')).toBe(3);
    expect(iosWeekday('wed')).toBe(4);
    expect(iosWeekday('thu')).toBe(5);
    expect(iosWeekday('fri')).toBe(6);
    expect(iosWeekday('sat')).toBe(7);
  });
});

describe('nextIosWeekday', () => {
  it('advances within the week', () => {
    expect(nextIosWeekday(2)).toBe(3);
  });

  it('wraps from saturday to sunday', () => {
    expect(nextIosWeekday(7)).toBe(1);
  });
});

describe('isOvernightRange', () => {
  it('reports false for a same-day range', () => {
    expect(isOvernightRange('09:00', '17:00')).toBe(false);
  });

  it('reports true when end is earlier than start', () => {
    expect(isOvernightRange('22:00', '06:00')).toBe(true);
  });
});

describe('rangeDurationMinutes', () => {
  it('measures a same-day range', () => {
    expect(rangeDurationMinutes('09:00', '17:00')).toBe(8 * 60);
  });

  it('wraps around midnight', () => {
    expect(rangeDurationMinutes('22:00', '06:00')).toBe(8 * 60);
  });
});

describe('validateTimeRange', () => {
  it('accepts a same-day range', () => {
    expect(() => validateTimeRange('09:00', '17:00')).not.toThrow();
  });

  it('accepts an overnight range', () => {
    expect(() => validateTimeRange('22:00', '06:00')).not.toThrow();
  });

  it('rejects identical times', () => {
    expect(() => validateTimeRange('09:00', '09:00')).toThrow(/differ/i);
  });

  it('rejects malformed times', () => {
    expect(() => validateTimeRange('9:00', '17:00')).toThrow(/24-hour/i);
  });
});
