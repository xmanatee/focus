import { describe, expect, it } from 'vitest';
import type { DayOfWeek } from '../features/schedule/types';
import { formatActiveDays, iosWeekday } from './days';

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
