import { describe, expect, it } from 'vitest';
import { resolveProtectionPosture } from './posture';
import type { TamperSetup } from './types';

function setupWith(overrides: Partial<TamperSetup> = {}): TamperSetup {
  return {
    passcode: { kind: 'unset' },
    deleteLock: { kind: 'unset' },
    installLock: { kind: 'unset' },
    completedAt: null,
    ...overrides,
  };
}

describe('resolveProtectionPosture', () => {
  it('scores none when nothing is set', () => {
    const out = resolveProtectionPosture(setupWith());
    expect(out.score).toBe('none');
    expect(out.defenses.every((d) => d.ok === false)).toBe(true);
  });

  it('scores partial with one or two acks', () => {
    const out = resolveProtectionPosture(
      setupWith({ passcode: { kind: 'set', at: 1 } }),
    );
    expect(out.score).toBe('partial');
  });

  it('scores full when all three are set', () => {
    const out = resolveProtectionPosture(
      setupWith({
        passcode: { kind: 'set', at: 1 },
        deleteLock: { kind: 'set', at: 2 },
        installLock: { kind: 'set', at: 3 },
      }),
    );
    expect(out.score).toBe('full');
    expect(out.defenses.every((d) => d.ok)).toBe(true);
  });

  it('lists defenses in stable id order', () => {
    const out = resolveProtectionPosture(setupWith());
    expect(out.defenses.map((d) => d.id)).toEqual([
      'passcode',
      'deleteLock',
      'installLock',
    ]);
  });
});
