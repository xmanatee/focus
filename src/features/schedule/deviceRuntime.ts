import { focusBlockWithDeviceEnabledState } from './deviceActivation';
import { focusBlockNeedsLocalSelection } from './localActivitySelection';
import type { FocusBlock } from './types';

export function focusBlockRunnableOnDevice<T extends FocusBlock>(
  block: T,
  deviceId: string | null,
): T {
  const blockOnThisDevice = focusBlockWithDeviceEnabledState(block, deviceId);
  return focusBlockNeedsLocalSelection(block)
    ? { ...blockOnThisDevice, isEnabled: false }
    : blockOnThisDevice;
}

export function focusBlocksRunnableOnDevice<T extends FocusBlock>(
  blocks: readonly T[],
  deviceId: string | null,
): readonly T[] {
  return blocks.map((block) => focusBlockRunnableOnDevice(block, deviceId));
}
