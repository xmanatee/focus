import { describe, expect, it } from 'vitest';
import { isScheduleActiveAt, nextStartAfter } from './activeness';

const weekday = {
  days: ['mon', 'tue', 'wed', 'thu', 'fri'] as const,
  startTime: '09:00',
  endTime: '17:00',
  isEnabled: true,
};

const overnight = {
  days: ['mon', 'tue', 'wed', 'thu', 'fri'] as const,
  startTime: '22:00',
  endTime: '06:00',
  isEnabled: true,
};

function at(iso: string): Date {
  return new Date(iso);
}

describe('isScheduleActiveAt', () => {
  it('active on weekday mid-window', () => {
    expect(isScheduleActiveAt(weekday, at('2026-04-27T10:30:00'))).toBe(true);
  });

  it('inactive before window', () => {
    expect(isScheduleActiveAt(weekday, at('2026-04-27T08:00:00'))).toBe(false);
  });

  it('inactive at exact end (exclusive)', () => {
    expect(isScheduleActiveAt(weekday, at('2026-04-27T17:00:00'))).toBe(false);
  });

  it('inactive on weekend', () => {
    expect(isScheduleActiveAt(weekday, at('2026-04-25T10:00:00'))).toBe(false);
  });

  it('ignores when disabled', () => {
    expect(
      isScheduleActiveAt(
        { ...weekday, isEnabled: false },
        at('2026-04-27T10:30:00'),
      ),
    ).toBe(false);
  });

  it('overnight window active late on the start day', () => {
    expect(isScheduleActiveAt(overnight, at('2026-04-27T23:30:00'))).toBe(true);
  });

  it('overnight window active early the next day', () => {
    expect(isScheduleActiveAt(overnight, at('2026-04-28T05:00:00'))).toBe(true);
  });

  it('overnight window inactive after wake on non-start day', () => {
    expect(isScheduleActiveAt(overnight, at('2026-04-28T06:30:00'))).toBe(
      false,
    );
  });
});

describe('nextStartAfter', () => {
  it('returns today later when now is before start', () => {
    const next = nextStartAfter(weekday, at('2026-04-27T08:00:00'));
    expect(next?.day).toBe('mon');
    expect(next?.at.getHours()).toBe(9);
  });

  it('returns tomorrow when now is past today start', () => {
    const next = nextStartAfter(weekday, at('2026-04-27T10:00:00'));
    expect(next?.day).toBe('tue');
  });

  it('skips non-scheduled days', () => {
    const next = nextStartAfter(weekday, at('2026-04-25T10:00:00'));
    expect(next?.day).toBe('mon');
  });

  it('returns null when schedule is disabled', () => {
    expect(nextStartAfter({ ...weekday, isEnabled: false }, new Date())).toBe(
      null,
    );
  });

  it('returns null when no days are selected', () => {
    expect(nextStartAfter({ ...weekday, days: [] }, new Date())).toBe(null);
  });
});
