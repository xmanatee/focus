import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';
import { slotStore } from '../../test-helpers/mockDeviceActivity';
import {
  clearSlot,
  copySlot,
  getSlotValue,
  isSlotPopulated,
  writeSlot,
} from './selectionSlot';
import { type SelectionSlotId, selectionIdForBlock } from './types';

describe('selectionSlot', () => {
  beforeEach(() => {
    slotStore.clear();
  });

  it('copySlot transfers value from source to target', () => {
    const source = selectionIdForBlock('source');
    const target = selectionIdForBlock('target');

    writeSlot(source, 'token-a');
    copySlot(source, target);

    expect(getSlotValue(target)).toBe('token-a');
  });

  it('isSlotPopulated returns false for untouched slot', () => {
    expect(isSlotPopulated(selectionIdForBlock('empty'))).toBe(false);
  });

  it('isSlotPopulated returns true after write', () => {
    const slot = selectionIdForBlock('filled');
    writeSlot(slot, 'token-b');
    expect(isSlotPopulated(slot)).toBe(true);
  });

  it('clearSlot empties the slot', () => {
    const slot = selectionIdForBlock('block-1');
    writeSlot(slot, 'token-c');
    clearSlot(slot);
    expect(isSlotPopulated(slot)).toBe(false);
  });

  it('getSlotValue returns undefined for empty slot', () => {
    expect(getSlotValue(selectionIdForBlock('missing'))).toBeUndefined();
  });

  it('selection slot IDs are branded', () => {
    expectTypeOf<string>().not.toMatchTypeOf<SelectionSlotId>();
    expectTypeOf(selectionIdForBlock('abc')).toMatchTypeOf<SelectionSlotId>();
  });
});
