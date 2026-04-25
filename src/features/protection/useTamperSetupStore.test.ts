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

const { useTamperSetupStore } = await import('./useTamperSetupStore');
const { resolveProtectionPosture } = await import('./posture');
const { DEFENSE_IDS } = await import('./types');

function reset(): void {
  memoryMap.clear();
  useTamperSetupStore.setState({
    setup: {
      acks: Object.fromEntries(
        DEFENSE_IDS.map((id) => [id, { kind: 'unset' }] as const),
      ) as never,
    },
  });
}

describe('useTamperSetupStore', () => {
  beforeEach(reset);

  it('starts with all defenses unset', () => {
    const setup = useTamperSetupStore.getState().setup;
    expect(setup.acks.screenTimeLock.kind).toBe('unset');
    expect(setup.acks.appDeletion.kind).toBe('unset');
  });

  it('toggle moves an ack from unset to set with a timestamp', () => {
    useTamperSetupStore.getState().toggle('screenTimeLock');
    const ack = useTamperSetupStore.getState().setup.acks.screenTimeLock;
    expect(ack.kind).toBe('set');
    if (ack.kind === 'set') expect(ack.at).toBeGreaterThan(0);
  });

  it('toggle is idempotent in pairs (set → unset → set)', () => {
    const t = useTamperSetupStore.getState().toggle;
    t('screenTimeLock');
    t('screenTimeLock');
    expect(useTamperSetupStore.getState().setup.acks.screenTimeLock.kind).toBe(
      'unset',
    );
    t('screenTimeLock');
    expect(useTamperSetupStore.getState().setup.acks.screenTimeLock.kind).toBe(
      'set',
    );
  });

  it('toggling one defense does not disturb the other', () => {
    useTamperSetupStore.getState().toggle('screenTimeLock');
    expect(useTamperSetupStore.getState().setup.acks.appDeletion.kind).toBe(
      'unset',
    );
  });

  it('posture is partial after one ack and full after both', () => {
    useTamperSetupStore.getState().toggle('screenTimeLock');
    expect(
      resolveProtectionPosture(useTamperSetupStore.getState().setup).score,
    ).toBe('partial');
    useTamperSetupStore.getState().toggle('appDeletion');
    expect(
      resolveProtectionPosture(useTamperSetupStore.getState().setup).score,
    ).toBe('full');
  });

  it('completedAt becomes non-null only when every defense is acked', () => {
    useTamperSetupStore.getState().toggle('screenTimeLock');
    expect(
      resolveProtectionPosture(useTamperSetupStore.getState().setup)
        .completedAt,
    ).toBeNull();
    useTamperSetupStore.getState().toggle('appDeletion');
    expect(
      resolveProtectionPosture(useTamperSetupStore.getState().setup)
        .completedAt,
    ).not.toBeNull();
  });

  it('un-acking any defense after completion drops completedAt back to null', () => {
    const t = useTamperSetupStore.getState().toggle;
    t('screenTimeLock');
    t('appDeletion');
    t('appDeletion');
    expect(
      resolveProtectionPosture(useTamperSetupStore.getState().setup)
        .completedAt,
    ).toBeNull();
  });
});
