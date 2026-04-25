import { copySlot, isSlotPopulated } from '../blocker/selectionSlot';
import {
  type ActivitySelectionMetadata,
  type PersistedActivitySelection,
  createActivitySelectionFromMetadata,
  selectionIdForBlock,
} from '../blocker/types';
import { selectionIdForTemplate } from './presets';
import type { PresetKind } from './presets';

export function applyTemplateSelection(
  blockId: string,
  kind: PresetKind,
  templateMetadata: Partial<Record<PresetKind, ActivitySelectionMetadata>>,
): PersistedActivitySelection | 'needs-setup' {
  const templateSlot = selectionIdForTemplate(kind);
  const metadata = templateMetadata[kind];
  if (!isSlotPopulated(templateSlot) || metadata === undefined) {
    return 'needs-setup';
  }
  copySlot(templateSlot, selectionIdForBlock(blockId));
  return createActivitySelectionFromMetadata(metadata);
}
