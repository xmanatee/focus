import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SUNDAY_SETUP_BLOCK,
  focusBlockInput,
} from '../../test-helpers/focusBlockFixtures';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useSetupBlockDeviceStore } from '../settings/setupBlockDeviceStore';
import { useSettingsStore } from '../settings/useSettingsStore';
import { useBlockActivationStore } from './useBlockActivationStore';
import { useFocusBlockStore } from './useFocusBlockStore';

function reset(): void {
  storageMap.clear();
  useBlockActivationStore.setState({ enabledBlockIds: [] });
  useFocusBlockStore.setState({ focusBlocks: [] });
  useSetupBlockDeviceStore.setState({
    isEnabledOnDevice: false,
  });
  useSettingsStore.setState({ setupBlock: null });
}

function focusBlockStorageKey(): string {
  const name = useFocusBlockStore.persist.getOptions().name;
  if (name === undefined) {
    throw new Error('Focus block storage key is missing.');
  }
  return name;
}

describe('useFocusBlockStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
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
      useBlockActivationStore.getState().setBlockEnabled('id-1', true);
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      useSetupBlockDeviceStore.getState().enableOnDevice();
      expect(() =>
        useFocusBlockStore
          .getState()
          .updateFocusBlock('id-1', focusBlockInput({ name: 'Renamed' })),
      ).toThrow(/lock-in/i);
    });

    it('rejects when the block is currently active', () => {
      vi.setSystemTime(new Date('2026-04-27T12:00:00'));
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useBlockActivationStore.getState().setBlockEnabled('id-1', true);
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

    it('allows update when lock-in is configured but off on this device', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });

      useFocusBlockStore
        .getState()
        .updateFocusBlock('id-1', focusBlockInput({ name: 'Renamed' }));

      expect(useFocusBlockStore.getState().focusBlocks[0].name).toBe('Renamed');
    });

    it('allows update when lock-in is active but the block is not runnable here', () => {
      useFocusBlockStore.getState().addFocusBlock(
        'id-1',
        focusBlockInput({
          selection: {
            activitySelection: {
              applicationCount: 1,
              categoryCount: 0,
              includeEntireCategory: true,
              status: 'saved',
              webDomainCount: 0,
            },
            webDomains: [],
          },
        }),
      );
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      useSetupBlockDeviceStore.getState().enableOnDevice();
      useBlockActivationStore.getState().setBlockEnabled('id-1', true);

      useFocusBlockStore.getState().updateFocusBlock(
        'id-1',
        focusBlockInput({
          name: 'Renamed',
          selection: {
            activitySelection: {
              applicationCount: 1,
              categoryCount: 0,
              includeEntireCategory: true,
              status: 'saved',
              webDomainCount: 0,
            },
            webDomains: [],
          },
        }),
      );

      expect(useFocusBlockStore.getState().focusBlocks[0].name).toBe('Renamed');
    });

    it('allows update during the scheduled window when block is off locally', () => {
      vi.setSystemTime(new Date('2026-04-27T12:00:00'));
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());

      useFocusBlockStore.getState().updateFocusBlock(
        'id-1',
        focusBlockInput({
          name: 'Renamed',
        }),
      );

      expect(useFocusBlockStore.getState().focusBlocks[0].name).toBe('Renamed');
    });
  });

  describe('deleteFocusBlock', () => {
    it('rejects when admin is locked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useBlockActivationStore.getState().setBlockEnabled('id-1', true);
      useSettingsStore.setState({ setupBlock: SUNDAY_SETUP_BLOCK });
      useSetupBlockDeviceStore.getState().enableOnDevice();
      expect(() =>
        useFocusBlockStore.getState().deleteFocusBlock('id-1'),
      ).toThrow(/lock-in/i);
    });

    it('allows delete when unlocked', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useBlockActivationStore.getState().setBlockEnabled('id-1', true);
      useFocusBlockStore.getState().deleteFocusBlock('id-1');
      expect(useFocusBlockStore.getState().focusBlocks).toHaveLength(0);
      expect(useBlockActivationStore.getState().isBlockEnabled('id-1')).toBe(
        false,
      );
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

  describe('persisted state', () => {
    function persistedBlock() {
      return {
        ...focusBlockInput(),
        id: 'stored-block',
        name: 'Stored block',
      };
    }

    it('hydrates current explicit focus block data', async () => {
      storageMap.set(
        focusBlockStorageKey(),
        JSON.stringify({
          state: { focusBlocks: [persistedBlock()] },
          version: 2,
        }),
      );

      await useFocusBlockStore.persist.rehydrate();

      expect(useFocusBlockStore.persist.hasHydrated()).toBe(true);
      expect(useFocusBlockStore.getState().focusBlocks).toEqual([
        persistedBlock(),
      ]);
    });

    it('rejects persisted blocks without an explicit rule', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const { rule: _rule, ...withoutRule } = persistedBlock();
      storageMap.set(
        focusBlockStorageKey(),
        JSON.stringify({
          state: { focusBlocks: [withoutRule] },
          version: 2,
        }),
      );

      try {
        await useFocusBlockStore.persist.rehydrate();
        expect(useFocusBlockStore.persist.hasHydrated()).toBe(false);
        expect(useFocusBlockStore.getState().focusBlocks).toEqual([]);
      } finally {
        consoleError.mockRestore();
      }
    });
  });
});
