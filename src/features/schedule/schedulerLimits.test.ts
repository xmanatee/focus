import { beforeEach, describe, expect, it } from 'vitest';
import { runtimeBlock } from '../../test-helpers/focusBlockFixtures';
import {
  configuredActions,
  monitoringCalls,
  resetDeviceActivityMock,
} from '../../test-helpers/mockDeviceActivity';
import { storageMap } from '../../test-helpers/mockPersistedStorage';
import { reconcileFocusBlocks } from './scheduler';
import { DAY_OF_WEEK_VALUES } from './types';

describe('reconcileFocusBlocks monitor limits', () => {
  beforeEach(() => {
    resetDeviceActivityMock();
    storageMap.clear();
  });

  it('rejects plans above the iOS activity limit before applying monitors', async () => {
    await expect(
      reconcileFocusBlocks(
        ['a', 'b', 'c'].map((id) =>
          runtimeBlock({ id, days: DAY_OF_WEEK_VALUES }),
        ),
        null,
      ),
    ).rejects.toThrow(/20/);

    expect(configuredActions).toEqual([]);
    expect(monitoringCalls).toEqual([]);
  });
});
