import { describe, expect, it } from 'vitest';
import { resolveEmergencyQuota } from './quota';
import type { EmergencyMode } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function enabledMode(
  overrides: Partial<Extract<EmergencyMode, { kind: 'enabled' }>> = {},
): EmergencyMode {
  return {
    kind: 'enabled',
    weeklyLimit: 2,
    cooldownMinutes: 15,
    codeLength: 8,
    currentCode: 'ABCDEFGH',
    history: [],
    ...overrides,
  };
}

describe('resolveEmergencyQuota', () => {
  const now = new Date('2026-04-25T12:00:00Z');

  it('returns disabled when mode is disabled', () => {
    const out = resolveEmergencyQuota({ kind: 'disabled' }, now);
    expect(out.kind).toBe('disabled');
  });

  it('returns ready when no usage', () => {
    const out = resolveEmergencyQuota(enabledMode(), now);
    expect(out).toEqual({
      kind: 'ready',
      remainingThisWeek: 2,
      codeLength: 8,
    });
  });

  it('decrements remaining for in-window usage', () => {
    const out = resolveEmergencyQuota(
      enabledMode({
        history: [{ usedAt: now.getTime() - 2 * DAY }],
        cooldownMinutes: 0,
      }),
      now,
    );
    expect(out.kind).toBe('ready');
    if (out.kind === 'ready') {
      expect(out.remainingThisWeek).toBe(1);
    }
  });

  it('returns exhausted when usage hits weekly limit', () => {
    const out = resolveEmergencyQuota(
      enabledMode({
        history: [
          { usedAt: now.getTime() - 6 * DAY },
          { usedAt: now.getTime() - 1 * DAY },
        ],
      }),
      now,
    );
    expect(out.kind).toBe('exhausted');
  });

  it('returns cooldown when last usage is within cooldown window', () => {
    const out = resolveEmergencyQuota(
      enabledMode({
        cooldownMinutes: 30,
        history: [{ usedAt: now.getTime() - 10 * 60 * 1000 }],
      }),
      now,
    );
    expect(out.kind).toBe('cooldown');
  });

  it('ignores stale uses outside the 7-day window', () => {
    const out = resolveEmergencyQuota(
      enabledMode({
        weeklyLimit: 1,
        history: [{ usedAt: now.getTime() - 8 * DAY }],
      }),
      now,
    );
    expect(out.kind).toBe('ready');
  });
});
