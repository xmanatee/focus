import type { SetupBlock } from '../settings/adminState';
import { reconcileRuntimePlatform } from './runtimeReconciler';
import type { RuntimeFocusBlock } from './types';

let pendingReconciliation = Promise.resolve();

export function reconcileFocusBlocks(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
  at: Date = new Date(),
): Promise<void> {
  const reconcile = () => reconcileRuntimePlatform(blocks, setupBlock, at);
  const current = pendingReconciliation.then(reconcile, reconcile);
  pendingReconciliation = current;
  return current;
}
