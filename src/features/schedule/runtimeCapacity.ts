import { BlockerBridge } from '../../bridge/BlockerBridge';
import type { SetupBlock } from '../settings/adminState';
import type { RuntimeFocusBlock } from './types';

function monitorCount(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
): number {
  const blockMonitors = blocks.reduce(
    (total, block) => total + (block.isEnabled ? block.days.length : 0),
    0,
  );
  const setupMonitors =
    setupBlock?.notifyOnStart === true ? setupBlock.days.length : 0;
  return blockMonitors + setupMonitors;
}

export function assertRuntimeMonitorCapacity(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
): void {
  const limit = BlockerBridge.capabilities.maxScheduledMonitors;
  if (limit === null) return;

  const count = monitorCount(blocks, setupBlock);
  if (count <= limit) return;

  throw new Error(
    `This setup needs ${count} schedule monitors, but this device supports ${limit}. Turn off a block or select fewer active days.`,
  );
}
