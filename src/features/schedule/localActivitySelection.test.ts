import { beforeEach, describe, expect, it } from 'vitest';
import { runtimeBlock } from '../../test-helpers/focusBlockFixtures';
import { slotStore } from '../../test-helpers/mockDeviceActivity';
import { writeSlot } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import {
  activitySelectionHasLocalSlot,
  activitySelectionNeedsLocalSlot,
  focusBlockNeedsLocalSelection,
  focusBlockSelectionReadyInSlots,
} from './localActivitySelection';
import type { FocusBlock } from './types';

function block(overrides: Partial<FocusBlock> = {}): FocusBlock {
  return runtimeBlock({ id: 'block-a', ...overrides });
}

describe('local activity selection helpers', () => {
  beforeEach(() => {
    slotStore.clear();
  });

  it('requires local setup only for saved selections without a local slot', () => {
    const saved = block().selection.activitySelection;
    const empty = { status: 'empty' } as const;

    expect(activitySelectionNeedsLocalSlot('block-a', saved)).toBe(true);
    expect(activitySelectionNeedsLocalSlot('block-a', empty)).toBe(false);
    expect(activitySelectionHasLocalSlot('block-a', empty)).toBe(false);

    writeSlot(selectionIdForBlock('block-a'), 'local-selection');

    expect(activitySelectionNeedsLocalSlot('block-a', saved)).toBe(false);
    expect(activitySelectionHasLocalSlot('block-a', saved)).toBe(true);
  });

  it('tracks missing local setup independently from local activation', () => {
    const synced = block();
    const populatedSlots = new Set<string>([selectionIdForBlock('block-a')]);

    expect(focusBlockNeedsLocalSelection(synced)).toBe(true);
    expect(focusBlockSelectionReadyInSlots(synced, populatedSlots)).toBe(true);
    expect(focusBlockSelectionReadyInSlots(synced, new Set())).toBe(false);
  });
});
