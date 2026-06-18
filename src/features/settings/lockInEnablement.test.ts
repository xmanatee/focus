import { beforeEach, describe, expect, it } from 'vitest';
import { focusBlockInput } from '../../test-helpers/focusBlockFixtures';
import { slotStore } from '../../test-helpers/mockDeviceActivity';
import type { FocusBlock, FocusBlockInput } from '../schedule/types';
import { resolveLockInEnablement } from './lockInEnablement';

function block(
  id: string,
  overrides: Partial<FocusBlockInput> = {},
): FocusBlock {
  return {
    id,
    ...focusBlockInput(overrides),
  };
}

describe('resolveLockInEnablement', () => {
  beforeEach(() => {
    slotStore.clear();
  });

  it('blocks Lock-in enablement before any locally enabled runnable block is ready', () => {
    expect(resolveLockInEnablement([], []).kind).toBe('blocked');
    expect(resolveLockInEnablement([block('synced-block')], []).kind).toBe(
      'blocked',
    );
  });

  it('blocks Lock-in enablement when an armed app block still needs local selection', () => {
    expect(
      resolveLockInEnablement(
        [
          block('missing-selection', {
            selection: {
              activitySelection: {
                applicationCount: 1,
                categoryCount: 0,
                includeEntireCategory: true,
                status: 'saved',
                webDomainCount: 0,
              },
              webDomains: [],
            },
          }),
        ],
        ['missing-selection'],
      ).kind,
    ).toBe('blocked');
  });

  it('allows Lock-in once at least one enabled block is ready on this device', () => {
    slotStore.set('block.ready', 'selection-ready');

    expect(
      resolveLockInEnablement(
        [
          block('ready', {
            selection: {
              activitySelection: {
                applicationCount: 1,
                categoryCount: 0,
                includeEntireCategory: true,
                status: 'saved',
                webDomainCount: 0,
              },
              webDomains: [],
            },
          }),
        ],
        ['ready'],
      ).kind,
    ).toBe('allowed');
  });
});
