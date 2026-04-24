import { describe, expect, it } from 'vitest';
import { type SetupWindow, resolveAdminState } from './adminState';

const monFri9to17: SetupWindow = {
  days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  startTime: '09:00',
  endTime: '17:00',
};

const sundayNight: SetupWindow = {
  days: ['sun'],
  startTime: '20:00',
  endTime: '21:00',
};

function at(iso: string): Date {
  return new Date(iso);
}

describe('resolveAdminState', () => {
  it('is unlocked when no setup window is configured', () => {
    const state = resolveAdminState(null, at('2026-04-27T10:00:00'));
    expect(state.kind).toBe('unlocked');
    if (state.kind === 'unlocked') {
      expect(state.reason).toBe('always');
    }
  });

  it('is unlocked when inside the setup window', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-27T10:00:00'));
    expect(state.kind).toBe('unlocked');
    if (state.kind === 'unlocked') {
      expect(state.reason).toBe('inside-window');
    }
  });

  it('is locked before the window opens', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-27T08:00:00'));
    expect(state.kind).toBe('locked');
    if (state.kind === 'locked') {
      expect(state.nextUnlock?.day).toBe('mon');
      expect(state.nextUnlock?.at.getHours()).toBe(9);
    }
  });

  it('is locked on weekends with weekday setup window', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-25T10:00:00'));
    expect(state.kind).toBe('locked');
    if (state.kind === 'locked') {
      expect(state.nextUnlock?.day).toBe('mon');
    }
  });

  it('is locked at the exact end of the window', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-27T17:00:00'));
    expect(state.kind).toBe('locked');
  });

  it('computes the next unlock for a weekly single-day window', () => {
    const state = resolveAdminState(sundayNight, at('2026-04-27T10:00:00'));
    expect(state.kind).toBe('locked');
    if (state.kind === 'locked') {
      expect(state.nextUnlock?.day).toBe('sun');
    }
  });

  it('is unlocked exactly at the start minute', () => {
    const state = resolveAdminState(sundayNight, at('2026-04-26T20:00:00'));
    expect(state.kind).toBe('unlocked');
  });
});
