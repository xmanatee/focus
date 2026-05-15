import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SUNDAY_SETUP_BLOCK,
  focusBlockInput,
} from '../../test-helpers/focusBlockFixtures';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useSettingsStore } from '../settings/useSettingsStore';
import { useFocusBlockStore } from './useFocusBlockStore';

function reset(): void {
  storageMap.clear();
  useFocusBlockStore.setState({ focusBlocks: [] });
  useSettingsStore.setState({ setupBlock: null });
}

describe('useFocusBlockStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Saturday 2026-04-25 15:00 — outside any plausible window below
    vi.setSystemTime(new Date('2026-04-25T15:00:00'));
    reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addFocusBlock', () => {
    it('allows add when admin is unlocked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      expect(useFocusBlockStore.getState().focusBlocks).toHaveLength(1);
    });

    it('allows add even when admin is locked', () => {
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      expect(useFocusBlockStore.getState().focusBlocks).toHaveLength(1);
    });

    it('coerces strict to false when setupBlock is configured', () => {
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      expect(useFocusBlockStore.getState().focusBlocks[0].strict).toBe(false);
    });

    it('preserves strict when no setupBlock', () => {
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      expect(useFocusBlockStore.getState().focusBlocks[0].strict).toBe(true);
    });
  });

  describe('updateFocusBlock', () => {
    it('rejects when admin is locked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      expect(() =>
        useFocusBlockStore
          .getState()
          .updateFocusBlock('id-1', focusBlockInput({ name: 'Renamed' })),
      ).toThrow(/lock-in/i);
    });

    it('rejects when the block is currently active', () => {
      // Block runs Mon-Fri 09:00-17:00. Set time to Mon 12:00.
      vi.setSystemTime(new Date('2026-04-27T12:00:00'));
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      expect(() =>
        useFocusBlockStore
          .getState()
          .updateFocusBlock('id-1', focusBlockInput({ name: 'Renamed' })),
      ).toThrow(/while it is active/i);
    });

    it('allows update when unlocked and not active', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useFocusBlockStore
        .getState()
        .updateFocusBlock('id-1', focusBlockInput({ name: 'Renamed' }));
      expect(useFocusBlockStore.getState().focusBlocks[0].name).toBe('Renamed');
    });
  });

  describe('toggleFocusBlock', () => {
    it('rejects when admin is locked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      expect(() =>
        useFocusBlockStore.getState().toggleFocusBlock('id-1', false),
      ).toThrow(/lock-in/i);
    });

    it('allows toggle when unlocked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useFocusBlockStore.getState().toggleFocusBlock('id-1', false);
      expect(useFocusBlockStore.getState().focusBlocks[0].isEnabled).toBe(
        false,
      );
    });
  });

  describe('deleteFocusBlock', () => {
    it('rejects when admin is locked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      expect(() =>
        useFocusBlockStore.getState().deleteFocusBlock('id-1'),
      ).toThrow(/lock-in/i);
    });

    it('allows delete when unlocked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useFocusBlockStore.getState().deleteFocusBlock('id-1');
      expect(useFocusBlockStore.getState().focusBlocks).toHaveLength(0);
    });
  });

  describe('clearAllStrict', () => {
    it('zeroes strict on every block', () => {
      const store = useFocusBlockStore.getState();
      store.addFocusBlock('id-1', focusBlockInput({ strict: true }));
      store.addFocusBlock('id-2', focusBlockInput({ strict: true }));
      store.addFocusBlock('id-3', focusBlockInput({ strict: false }));
      store.clearAllStrict();
      const after = useFocusBlockStore.getState().focusBlocks;
      expect(after.every((b) => b.strict === false)).toBe(true);
    });
  });
});
