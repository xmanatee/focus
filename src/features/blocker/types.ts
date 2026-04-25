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

export function summarizeActivitySelection(
  selection: PersistedActivitySelection,
): string {
  if (selection.status !== 'saved') return 'None';
  const parts: string[] = [];
  if (selection.applicationCount > 0) {
    const noun = selection.applicationCount === 1 ? 'app' : 'apps';
    parts.push(`${selection.applicationCount} ${noun}`);
  }
  if (selection.categoryCount > 0) {
    const noun = selection.categoryCount === 1 ? 'category' : 'categories';
    parts.push(`${selection.categoryCount} ${noun}`);
  }
  if (selection.webDomainCount > 0) {
    const noun = selection.webDomainCount === 1 ? 'domain' : 'domains';
    parts.push(`${selection.webDomainCount} ${noun}`);
  }
  return parts.length === 0 ? 'None' : parts.join(', ');
}
