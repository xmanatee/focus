import type { FocusBlock } from './types';

export function focusBlockAppliesToDevice(
  block: Pick<FocusBlock, 'scope'>,
  deviceId: string,
): boolean {
  if (block.scope.kind === 'allDevices') return true;
  return block.scope.deviceId === deviceId;
}
