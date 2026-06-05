import type { FocusBlock } from './types';

export function focusBlockAppliesToDevice(
  block: Pick<FocusBlock, 'scope'>,
  deviceId: string,
): boolean {
  if (block.scope.kind === 'allDevices') return true;
  return block.scope.deviceId === deviceId;
}

export function focusBlocksForDevice(
  focusBlocks: readonly FocusBlock[],
  deviceId: string | null,
): readonly FocusBlock[] {
  if (deviceId === null) return [];
  return focusBlocks.filter((block) =>
    focusBlockAppliesToDevice(block, deviceId),
  );
}
