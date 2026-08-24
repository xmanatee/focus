import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SUNDAY_SETUP_BLOCK,
  focusBlockInput,
} from '../../test-helpers/focusBlockFixtures';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { useBlockActivationStore } from '../schedule/useBlockActivationStore';
import { useFocusBlockStore } from '../schedule/useFocusBlockStore';
import {
  removeLockInConfiguration,
  saveLockInConfiguration,
} from './lockInConfiguration';
import { useSetupBlockDeviceStore } from './setupBlockDeviceStore';
import { useSettingsStore } from './useSettingsStore';

function reset(): void {
  storageMap.clear();
  useFocusBlockStore.setState({ focusBlocks: [] });
  useBlockActivationStore.setState({ enabledBlockIds: [] });
  useSetupBlockDeviceStore.setState({
    isEnabledOnDevice: false,
  });
  useSettingsStore.setState({ setupBlock: null });
}

describe('Lock-in configuration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T15:00:00'));
    reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('saveLockInConfiguration', () => {
    it('clears strict on all focus blocks when invoked', () => {
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-2', focusBlockInput({ strict: true }));
      expect(
        useFocusBlockStore.getState().focusBlocks.every((b) => b.strict),
      ).toBe(true);

      saveLockInConfiguration(SUNDAY_SETUP_BLOCK, false);

      expect(
        useFocusBlockStore.getState().focusBlocks.every((b) => !b.strict),
      ).toBe(true);
      expect(useSettingsStore.getState().setupBlock).toEqual(
        SUNDAY_SETUP_BLOCK,
      );
    });

    it('allows Lock-in configuration while strict blocks are inactive', () => {
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      expect(() =>
        saveLockInConfiguration(SUNDAY_SETUP_BLOCK, false),
      ).not.toThrow();
    });

    it('does not clear protection from an active strict block', () => {
      vi.setSystemTime(new Date('2026-04-27T10:00:00'));
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      useBlockActivationStore.getState().setBlockEnabled('id-1', true);

      expect(() => saveLockInConfiguration(SUNDAY_SETUP_BLOCK, false)).toThrow(
        'Cannot configure Lock-in while a strict block is active.',
      );
      expect(useFocusBlockStore.getState().focusBlocks[0]?.strict).toBe(true);
      expect(useSettingsStore.getState().setupBlock).toBeNull();
    });

    it('does not partially save when this device is not ready for Lock-in', () => {
      expect(() => saveLockInConfiguration(SUNDAY_SETUP_BLOCK, true)).toThrow(
        'Turn on at least one ready focus block',
      );
      expect(useSettingsStore.getState().setupBlock).toBeNull();
      expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(false);
    });

    it('saves and turns on a ready Lock-in configuration together', () => {
      useFocusBlockStore.getState().addFocusBlock('id-1', focusBlockInput());
      useBlockActivationStore.getState().setBlockEnabled('id-1', true);

      saveLockInConfiguration(SUNDAY_SETUP_BLOCK, true);

      expect(useSettingsStore.getState().setupBlock).toEqual(
        SUNDAY_SETUP_BLOCK,
      );
      expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(true);
    });
  });

  describe('removeLockInConfiguration', () => {
    it('does not resurrect strict flags', () => {
      useFocusBlockStore
        .getState()
        .addFocusBlock('id-1', focusBlockInput({ strict: true }));
      saveLockInConfiguration(SUNDAY_SETUP_BLOCK, false);
      removeLockInConfiguration();
      expect(useFocusBlockStore.getState().focusBlocks[0].strict).toBe(false);
    });

    it('turns off local enforcement with the removed setup block', () => {
      saveLockInConfiguration(SUNDAY_SETUP_BLOCK, false);
      useSetupBlockDeviceStore.getState().enableOnDevice();
      vi.setSystemTime(new Date('2026-04-26T20:30:00'));

      removeLockInConfiguration();

      expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(false);
    });

    it('cannot remove an active Lock-in configuration', () => {
      saveLockInConfiguration(SUNDAY_SETUP_BLOCK, false);
      useSetupBlockDeviceStore.getState().enableOnDevice();

      expect(() => removeLockInConfiguration()).toThrow('Lock-in is active.');
      expect(useSettingsStore.getState().setupBlock).toEqual(
        SUNDAY_SETUP_BLOCK,
      );
      expect(useSetupBlockDeviceStore.getState().isEnabledOnDevice).toBe(true);
    });
  });
});
