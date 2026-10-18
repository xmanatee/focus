import { androidBlockerNativeModule } from '../../bridge/AndroidBlockerNative';
import { BlockerBridge } from '../../bridge/BlockerBridge';
import { reconcileAndroidNotifications } from '../../bridge/androidNotifications';
import { serializeAndroidRuntimePlan } from '../../bridge/androidRuntimePlan';
import type { SetupBlock } from '../settings/adminState';
import type { RuntimeFocusBlock } from './types';

export async function reconcileRuntimePlatform(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
  _at: Date,
): Promise<void> {
  await androidBlockerNativeModule().reconcileRuntimeBlocks(
    serializeAndroidRuntimePlan(blocks, BlockerBridge.getSelectionSlotValue),
  );
  await reconcileAndroidNotifications(blocks, setupBlock);
}
