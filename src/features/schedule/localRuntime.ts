import type { RuntimeAccessState } from '../../bridge/BlockerBridge.types';
import { focusBlockNeedsLocalSelection } from './localActivitySelection';
import { missingRuntimeAccess } from './runtimeAccess';
import type { FocusBlock, RuntimeFocusBlock } from './types';

export function focusBlockRunnableLocally(
  block: FocusBlock,
  isLocallyEnabled: boolean,
  localSelectionReady: boolean,
  runtimeAccessReady: boolean,
): RuntimeFocusBlock {
  return {
    ...block,
    isEnabled: isLocallyEnabled && localSelectionReady && runtimeAccessReady,
  };
}

export function focusBlocksRunnableLocally(
  blocks: readonly FocusBlock[],
  locallyEnabledBlockIds: readonly string[],
  runtimeAccess: RuntimeAccessState,
): readonly RuntimeFocusBlock[] {
  return blocks.map((block) =>
    focusBlockRunnableLocally(
      block,
      locallyEnabledBlockIds.includes(block.id),
      !focusBlockNeedsLocalSelection(block),
      missingRuntimeAccess(block, runtimeAccess).length === 0,
    ),
  );
}
