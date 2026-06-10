import { describe, expect, it } from 'vitest';
import { EMPTY_BLOCK_SELECTION } from '../blocker/types';
import {
  focusBlockIsEnabledOnDevice,
  focusBlockWithDeviceEnabledState,
} from './deviceActivation';
import type { FocusBlock } from './types';

function block(overrides: Partial<FocusBlock> = {}): FocusBlock {
  return {
    id: 'block-a',
    name: 'Block',
    startTime: '09:00',
    endTime: '17:00',
    days: ['mon'],
    isEnabled: true,
    enabledDeviceIds: ['iphone-a'],
    scope: { kind: 'allDevices' },
    rule: { kind: 'blockDuringSchedule' },
    selection: EMPTY_BLOCK_SELECTION,
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: false,
    ...overrides,
  };
}

describe('device activation', () => {
  it('requires explicit arming on the current device', () => {
    const syncedFromAnotherPhone = block({
      enabledDeviceIds: ['iphone-a'],
    });

    expect(
      focusBlockIsEnabledOnDevice(syncedFromAnotherPhone, 'iphone-b'),
    ).toBe(false);
    expect(
      focusBlockWithDeviceEnabledState(syncedFromAnotherPhone, 'iphone-b')
        .isEnabled,
    ).toBe(false);
  });

  it('keeps a block active on devices that explicitly armed it', () => {
    const syncedBlock = block({ enabledDeviceIds: ['iphone-a', 'iphone-b'] });

    expect(focusBlockIsEnabledOnDevice(syncedBlock, 'iphone-b')).toBe(true);
    expect(
      focusBlockWithDeviceEnabledState(syncedBlock, 'iphone-b').isEnabled,
    ).toBe(true);
  });

  it('treats missing device identity as not armed', () => {
    expect(focusBlockIsEnabledOnDevice(block(), null)).toBe(false);
  });
});
