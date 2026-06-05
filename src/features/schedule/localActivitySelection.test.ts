import { beforeEach, describe, expect, it } from 'vitest';
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
  return {
    id: 'block-a',
    name: 'Block',
    startTime: '09:00',
    endTime: '17:00',
    days: ['mon'],
    isEnabled: true,
    scope: { kind: 'allDevices' },
    rule: { kind: 'blockDuringSchedule' },
    selection: {
      activitySelection: {
        status: 'saved',
        applicationCount: 1,
        categoryCount: 0,
        webDomainCount: 0,
        includeEntireCategory: true,
      },
      webDomains: [],
    },
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: false,
    ...overrides,
  };
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

  it('ignores disabled blocks and supports pure populated-slot checks', () => {
    const enabled = block();
    const disabled = block({ isEnabled: false });
    const populatedSlots = new Set<string>([selectionIdForBlock('block-a')]);

    expect(focusBlockNeedsLocalSelection(enabled)).toBe(true);
    expect(focusBlockNeedsLocalSelection(disabled)).toBe(false);
    expect(focusBlockSelectionReadyInSlots(enabled, populatedSlots)).toBe(true);
    expect(focusBlockSelectionReadyInSlots(enabled, new Set())).toBe(false);
  });
});
