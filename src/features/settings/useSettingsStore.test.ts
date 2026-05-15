import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SUNDAY_SETUP_BLOCK,
  focusBlockInput,
} from '../../test-helpers/focusBlockFixtures';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useFocusBlockStore } from '../schedule/useFocusBlockStore';
import { useSettingsStore } from './useSettingsStore';

function reset(): void {
  storageMap.clear();
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
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-2', focusBlockInput({ strict: true }));
      expect(
        useFocusBlockStore.getState().focusBlocks.every((b) => b.strict),
      ).toBe(true);

      useSettingsStore.getState().setSetupBlock(SUNDAY_SETUP_BLOCK);

      expect(
        useFocusBlockStore.getState().focusBlocks.every((b) => !b.strict),
      ).toBe(true);
      expect(useSettingsStore.getState().setupBlock).toEqual(
        SUNDAY_SETUP_BLOCK,
      );
    });

    it('is allowed even when blocks are mid-strict', () => {
      // The user must be able to enable lock-in regardless of strict state.
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      expect(() =>
        useSettingsStore.getState().setSetupBlock(SUNDAY_SETUP_BLOCK),
      ).not.toThrow();
    });
  });

  describe('clearSetupBlock', () => {
    it('does not resurrect strict flags', () => {
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      useSettingsStore.getState().setSetupBlock(SUNDAY_SETUP_BLOCK);
      // strict has been cleared above
      useSettingsStore.getState().clearSetupBlock();
      expect(useFocusBlockStore.getState().focusBlocks[0].strict).toBe(false);
    });
  });
});
