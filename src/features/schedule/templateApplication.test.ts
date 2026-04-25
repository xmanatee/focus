import { beforeEach, describe, expect, it } from 'vitest';
import { slotStore } from '../../test-helpers/mockDeviceActivity';
import { getSlotValue, writeSlot } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import { applyTemplateSelection } from './activitySelectionLogic';
import { selectionIdForTemplate } from './presets';

describe('template application', () => {
  beforeEach(() => {
    slotStore.clear();
  });

  it('copies template slot into block slot when populated', () => {
    const blockId = 'block-a';
    const templateSlot = selectionIdForTemplate('work');
    const blockSlot = selectionIdForBlock(blockId);

    writeSlot(templateSlot, 'template-token');

    const result = applyTemplateSelection(blockId, 'work', {
      work: {
        applicationCount: 5,
        categoryCount: 1,
        webDomainCount: 2,
        includeEntireCategory: false,
      },
    });

    expect(getSlotValue(blockSlot)).toBe('template-token');
    expect(result).toEqual({
      status: 'saved',
      applicationCount: 5,
      categoryCount: 1,
      webDomainCount: 2,
      includeEntireCategory: false,
    });
  });

  it('returns needs-setup when template slot is empty', () => {
    const blockId = 'block-b';
    const blockSlot = selectionIdForBlock(blockId);

    writeSlot(blockSlot, 'existing-token');

    const result = applyTemplateSelection(blockId, 'evening', {});

    expect(result).toBe('needs-setup');
    expect(getSlotValue(blockSlot)).toBe('existing-token');
  });

  it('returns needs-setup without copying when metadata is missing', () => {
    const blockId = 'block-c';
    const templateSlot = selectionIdForTemplate('work');
    const blockSlot = selectionIdForBlock(blockId);

    writeSlot(templateSlot, 'template-token');

    const result = applyTemplateSelection(blockId, 'work', {});

    expect(result).toBe('needs-setup');
    expect(getSlotValue(blockSlot)).toBeUndefined();
  });
});
