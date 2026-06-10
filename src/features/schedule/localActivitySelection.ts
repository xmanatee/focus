import { isSlotPopulated } from '../blocker/selectionSlot';
import {
  type PersistedActivitySelection,
  hasSavedActivitySelection,
  selectionIdForBlock,
} from '../blocker/types';
import type { FocusBlock } from './types';

export function activitySelectionNeedsLocalSlot(
  blockId: string,
  selection: PersistedActivitySelection,
): boolean {
  return (
    hasSavedActivitySelection(selection) &&
    !isSlotPopulated(selectionIdForBlock(blockId))
  );
}

export function activitySelectionHasLocalSlot(
  blockId: string,
  selection: PersistedActivitySelection,
): boolean {
  return (
    hasSavedActivitySelection(selection) &&
    isSlotPopulated(selectionIdForBlock(blockId))
  );
}

export function focusBlockNeedsLocalSelection(block: FocusBlock): boolean {
  return activitySelectionNeedsLocalSlot(
    block.id,
    block.selection.activitySelection,
  );
}

export function focusBlockSelectionReadyInSlots(
  block: FocusBlock,
  populatedSlots: ReadonlySet<string>,
): boolean {
  if (!hasSavedActivitySelection(block.selection.activitySelection)) {
    return true;
  }
  return populatedSlots.has(selectionIdForBlock(block.id));
}
