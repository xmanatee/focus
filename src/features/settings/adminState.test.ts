import { describe, expect, it } from 'vitest';
import { type SetupBlock, resolveAdminState } from './adminState';

const monFri9to17: SetupBlock = {
  days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  startTime: '09:00',
  endTime: '17:00',
  notifyOnStart: true,
};

const sundayNight: SetupBlock = {
  days: ['sun'],
  startTime: '20:00',
  endTime: '22:00',
  notifyOnStart: true,
};

function at(iso: string): Date {
  return new Date(iso);
}

describe('resolveAdminState', () => {
  it('is unlocked when no setup block is configured', () => {
    const state = resolveAdminState(null, new Date());
    expect(state.kind).toBe('unlocked');
    if (state.kind === 'unlocked') {
      expect(state.reason).toBe('always');
    }
  });

  it('is unlocked when inside the setup block', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-27T10:00:00'));
    expect(state.kind).toBe('unlocked');
    if (state.kind === 'unlocked') {
      expect(state.reason).toBe('inside-block');
    }
  });

  it('is locked before the block opens', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-27T08:59:59'));
    expect(state.kind).toBe('locked');
    if (state.kind === 'locked') {
      expect(state.nextUnlock?.day).toBe('mon');
      expect(state.nextUnlock?.at.getHours()).toBe(9);
    }
  });

  it('is locked on weekends with weekday setup block', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-25T12:00:00'));
    expect(state.kind).toBe('locked');
    if (state.kind === 'locked') {
      expect(state.nextUnlock?.day).toBe('mon');
    }
  });

  it('is locked at the exact end of the block', () => {
    const state = resolveAdminState(monFri9to17, at('2026-04-27T17:00:00'));
    expect(state.kind).toBe('locked');
  });

  it('computes the next unlock for a weekly single-day block', () => {
    // Sunday night setup. Check it on Monday morning.
    const state = resolveAdminState(sundayNight, at('2026-04-27T09:00:00'));
    expect(state.kind).toBe('locked');
    if (state.kind === 'locked') {
      expect(state.nextUnlock?.day).toBe('sun');
      expect(state.nextUnlock?.at.getDate()).toBe(3); // Sunday May 3rd
    }
  });
});
