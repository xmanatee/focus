import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import { EMPTY_BLOCK_SELECTION } from '../blocker/types';
import type { DayOfWeek, FocusBlockInput } from '../schedule/types';
import type { SetupBlock } from './adminState';

const memoryMap = new Map<string, string>();

vi.mock('../../shared/storage', () => ({
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
}));

const { useSettingsStore } = await import('./useSettingsStore');
const { useFocusBlockStore } = await import('../schedule/useFocusBlockStore');

const SETUP_BLOCK: SetupBlock = {
  days: ['sun'] as DayOfWeek[],
  startTime: '20:00',
  endTime: '21:00',
  notifyOnStart: false,
};

function baseInput(overrides: Partial<FocusBlockInput> = {}): FocusBlockInput {
  return {
    name: 'Work',
    startTime: '09:00',
    endTime: '17:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'] as DayOfWeek[],
    isEnabled: true,
    selection: { ...EMPTY_BLOCK_SELECTION, webDomains: ['example.com'] },
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: true,
    ...overrides,
  };
}

function reset(): void {
  memoryMap.clear();
  useFocusBlockStore.setState({ focusBlocks: [] });
  useSettingsStore.setState({ setupBlock: null });
}

describe('useSettingsStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T15:00:00'));
    reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setSetupBlock', () => {
    it('clears strict on all focus blocks when invoked', () => {
      // Seed with strict blocks (no setupBlock yet, so strict is preserved)
      useFocusBlockStore.getState().addFocusBlock('id-1', baseInput());
      useFocusBlockStore.getState().addFocusBlock('id-2', baseInput());
      expect(
        useFocusBlockStore.getState().focusBlocks.every((b) => b.strict),
      ).toBe(true);

      useSettingsStore.getState().setSetupBlock(SETUP_BLOCK);

      expect(
        useFocusBlockStore.getState().focusBlocks.every((b) => !b.strict),
      ).toBe(true);
      expect(useSettingsStore.getState().setupBlock).toEqual(SETUP_BLOCK);
    });

    it('is allowed even when blocks are mid-strict', () => {
      // The user must be able to enable lock-in regardless of strict state.
      useFocusBlockStore.getState().addFocusBlock('id-1', baseInput());
      expect(() =>
        useSettingsStore.getState().setSetupBlock(SETUP_BLOCK),
      ).not.toThrow();
    });
  });

  describe('clearSetupBlock', () => {
    it('does not resurrect strict flags', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', baseInput());
      useSettingsStore.getState().setSetupBlock(SETUP_BLOCK);
      // strict has been cleared above
      useSettingsStore.getState().clearSetupBlock();
      expect(useFocusBlockStore.getState().focusBlocks[0].strict).toBe(false);
    });
  });
});
