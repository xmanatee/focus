import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';

const memoryMap = new Map<string, string>();

vi.mock('../../shared/storage', () => {
  return {
    persistedStorage: createJSONStorage(() => ({
      getItem: (key: string) => memoryMap.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memoryMap.set(key, value);
      },
      removeItem: (key: string) => {
        memoryMap.delete(key);
      },
    })),
    attachCloudSync: () => () => {},
    newId: () => 'test-id',
  };
});

const { useEmergencyStore } = await import('./useEmergencyStore');

describe('useEmergencyStore', () => {
  beforeEach(() => {
    memoryMap.clear();
    useEmergencyStore.setState({ mode: { kind: 'disabled' } });
  });

  it('configure(weeklyLimit=0) yields disabled mode', () => {
    useEmergencyStore
      .getState()
      .configure({ weeklyLimit: 0, cooldownMinutes: 5 });
    expect(useEmergencyStore.getState().mode.kind).toBe('disabled');
  });

  it('configure(enabled) initializes a fresh code and history', () => {
    useEmergencyStore
      .getState()
      .configure({ weeklyLimit: 2, cooldownMinutes: 5 });
    const mode = useEmergencyStore.getState().mode;
    expect(mode.kind).toBe('enabled');
    if (mode.kind === 'enabled') {
      expect(mode.codeLength).toBe(8);
      expect(mode.currentCode).toHaveLength(8);
      expect(mode.history).toEqual([]);
    }
  });

  it('reconfiguring an already-enabled mode preserves code and history', () => {
    useEmergencyStore
      .getState()
      .configure({ weeklyLimit: 2, cooldownMinutes: 5 });
    const before = useEmergencyStore.getState().mode;
    if (before.kind !== 'enabled') throw new Error('expected enabled');
    const code = before.currentCode;

    useEmergencyStore
      .getState()
      .configure({ weeklyLimit: 3, cooldownMinutes: 30 });
    const after = useEmergencyStore.getState().mode;
    expect(after.kind).toBe('enabled');
    if (after.kind === 'enabled') {
      expect(after.weeklyLimit).toBe(3);
      expect(after.cooldownMinutes).toBe(30);
      expect(after.currentCode).toBe(code);
      expect(after.history).toEqual([]);
    }
  });

  it('consume rejects wrong code', () => {
    useEmergencyStore
      .getState()
      .configure({ weeklyLimit: 2, cooldownMinutes: 0 });
    const result = useEmergencyStore.getState().consume('NOPE', new Date());
    expect(result).toEqual({ ok: false, reason: 'wrong-code' });
  });

  it('consume on disabled mode is not-ready', () => {
    const result = useEmergencyStore.getState().consume('ANYTHING', new Date());
    expect(result).toEqual({ ok: false, reason: 'not-ready' });
  });

  it('consume right code ratchets length and records history', () => {
    useEmergencyStore
      .getState()
      .configure({ weeklyLimit: 2, cooldownMinutes: 0 });
    const before = useEmergencyStore.getState().mode;
    if (before.kind !== 'enabled') throw new Error('expected enabled');

    const now = new Date('2026-04-25T12:00:00Z');
    const result = useEmergencyStore
      .getState()
      .consume(before.currentCode, now);
    expect(result.ok).toBe(true);

    const after = useEmergencyStore.getState().mode;
    expect(after.kind).toBe('enabled');
    if (after.kind === 'enabled') {
      expect(after.codeLength).toBe(12);
      expect(after.currentCode).toHaveLength(12);
      expect(after.history).toEqual([{ usedAt: now.getTime() }]);
    }
    if (result.ok) expect(result.nextCode).toHaveLength(12);
  });
});
