import { BlockerBridge } from '../../bridge/BlockerBridge';
import { reconcileAndroidNotifications } from '../../bridge/androidNotifications';
import type { SetupBlock } from '../settings/adminState';
import type { RuntimeFocusBlock } from './types';

export async function reconcileRuntimePlatform(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
  _at: Date,
): Promise<void> {
  await BlockerBridge.reconcileRuntimeBlocks(blocks);
  await reconcileAndroidNotifications(blocks, setupBlock);
}
