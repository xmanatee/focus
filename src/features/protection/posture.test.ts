import { describe, expect, it } from 'vitest';
import { resolveProtectionPosture } from './posture';
import {
  type Ack,
  DEFENSE_IDS,
  type DefenseId,
  type TamperSetup,
} from './types';

function setupWith(
  overrides: Partial<Record<DefenseId, Ack>> = {},
): TamperSetup {
  return {
    acks: {
      screenTimeLock: { kind: 'unset' },
      appDeletion: { kind: 'unset' },
      ...overrides,
    },
  };
}

describe('resolveProtectionPosture', () => {
  it('scores none when nothing is set', () => {
    const out = resolveProtectionPosture(setupWith());
    expect(out.score).toBe('none');
    expect(out.completedAt).toBeNull();
    expect(out.defenses.every((d) => d.ok === false)).toBe(true);
  });

  it('scores partial when only one defense is set', () => {
    const out = resolveProtectionPosture(
      setupWith({ screenTimeLock: { kind: 'set', at: 1 } }),
    );
    expect(out.score).toBe('partial');
    expect(out.completedAt).toBeNull();
  });

  it('scores full when all defenses are set, completedAt is the latest ack timestamp', () => {
    const out = resolveProtectionPosture(
      setupWith({
        screenTimeLock: { kind: 'set', at: 100 },
        appDeletion: { kind: 'set', at: 250 },
      }),
    );
    expect(out.score).toBe('full');
    expect(out.completedAt).toBe(250);
    expect(out.defenses.every((d) => d.ok)).toBe(true);
  });

  it('completedAt is null even when only some defenses are set', () => {
    const out = resolveProtectionPosture(
      setupWith({ appDeletion: { kind: 'set', at: 99 } }),
    );
    expect(out.completedAt).toBeNull();
  });

  it('lists defenses in DEFENSE_IDS order', () => {
    const out = resolveProtectionPosture(setupWith());
    expect(out.defenses.map((d) => d.id)).toEqual([...DEFENSE_IDS]);
  });
});
