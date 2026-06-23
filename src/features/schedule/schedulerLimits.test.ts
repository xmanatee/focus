import { beforeEach, describe, expect, it } from 'vitest';
import {
  configuredActions,
  monitoringCalls,
  resetDeviceActivityMock,
} from '../../test-helpers/mockDeviceActivity';
import { reconcileFocusBlocks } from './scheduler';
import { DAY_OF_WEEK_VALUES, type RuntimeFocusBlock } from './types';

function block(id: string): RuntimeFocusBlock {
  return {
    id,
    name: id,
    startTime: '09:00',
    endTime: '17:00',
    days: DAY_OF_WEEK_VALUES,
    isEnabled: true,
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
    rule: { kind: 'blockDuringSchedule' },
  };
}

describe('reconcileFocusBlocks monitor limits', () => {
  beforeEach(() => {
    resetDeviceActivityMock();
  });

  it('rejects plans above the iOS activity limit before applying monitors', async () => {
    await expect(
      reconcileFocusBlocks([block('a'), block('b'), block('c')], null),
    ).rejects.toThrow(/20/);

    expect(configuredActions).toEqual([]);
    expect(monitoringCalls).toEqual([]);
  });
});
