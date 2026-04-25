export type SelectionSlotId = string & { readonly __brand: 'SelectionSlotId' };

export interface ActivitySelectionMetadata {
  applicationCount: number;
  categoryCount: number;
  webDomainCount: number;
  includeEntireCategory: boolean;
}

export type PersistedActivitySelection =
  | { status: 'empty' }
  | ({ status: 'saved' } & ActivitySelectionMetadata);

export interface BlockSelection {
  activitySelection: PersistedActivitySelection;
  webDomains: string[];
}

const EMPTY_ACTIVITY_SELECTION: PersistedActivitySelection = {
  status: 'empty',
};

export const EMPTY_BLOCK_SELECTION: BlockSelection = {
  activitySelection: EMPTY_ACTIVITY_SELECTION,
  webDomains: [],
};

export function selectionIdForBlock(blockId: string): SelectionSlotId {
  return `block.${blockId}` as SelectionSlotId;
}

export function createActivitySelectionFromMetadata(
  metadata: ActivitySelectionMetadata,
): PersistedActivitySelection {
  if (
    metadata.applicationCount === 0 &&
    metadata.categoryCount === 0 &&
    metadata.webDomainCount === 0
  ) {
    return EMPTY_ACTIVITY_SELECTION;
  }
  return {
    status: 'saved',
    ...metadata,
  };
}

export function hasSavedActivitySelection(
  selection: PersistedActivitySelection,
): selection is Extract<PersistedActivitySelection, { status: 'saved' }> {
  return selection.status === 'saved';
}

export function selectionHasBlockedTargets(selection: BlockSelection): boolean {
  return (
    hasSavedActivitySelection(selection.activitySelection) ||
    selection.webDomains.length > 0
  );
}
