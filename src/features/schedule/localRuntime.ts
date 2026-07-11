import { focusBlockNeedsLocalSelection } from './localActivitySelection';
import { focusBlockUnsupportedReason } from './runtimeSupport';
import type { FocusBlock, RuntimeFocusBlock } from './types';

export function focusBlockRunnableLocally(
  block: FocusBlock,
  isLocallyEnabled: boolean,
  localSelectionReady = !focusBlockNeedsLocalSelection(block),
  runtimeSupported = focusBlockUnsupportedReason(block) === null,
): RuntimeFocusBlock {
  const blockOnThisDevice = { ...block, isEnabled: isLocallyEnabled };
  if (localSelectionReady && runtimeSupported) return blockOnThisDevice;
  return { ...blockOnThisDevice, isEnabled: false };
}

export function focusBlocksRunnableLocally(
  blocks: readonly FocusBlock[],
  locallyEnabledBlockIds: readonly string[],
): readonly RuntimeFocusBlock[] {
  return blocks.map((block) =>
    focusBlockRunnableLocally(block, locallyEnabledBlockIds.includes(block.id)),
  );
}
