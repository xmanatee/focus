import { beforeEach, describe, expect, it } from 'vitest';
import {
  focusBlockInput,
  savedSelection,
} from '../../test-helpers/focusBlockFixtures';
import { slotStore } from '../../test-helpers/mockDeviceActivity';
import type { FocusBlock, FocusBlockInput } from '../schedule/types';
import { resolveLockInEnablement } from './lockInEnablement';

const RUNTIME_ACCESS = {
  dailyBudgets: 'authorized',
  websiteBlocking: 'authorized',
} as const;

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
    expect(resolveLockInEnablement([], [], RUNTIME_ACCESS).kind).toBe(
      'blocked',
    );
    expect(
      resolveLockInEnablement([block('synced-block')], [], RUNTIME_ACCESS).kind,
    ).toBe('blocked');
  });

  it('blocks Lock-in enablement when an armed app block still needs local selection', () => {
    expect(
      resolveLockInEnablement(
        [
          block('missing-selection', {
            selection: savedSelection(),
          }),
        ],
        ['missing-selection'],
        RUNTIME_ACCESS,
      ).kind,
    ).toBe('blocked');
  });

  it('allows Lock-in once at least one enabled block is ready on this device', () => {
    slotStore.set('block.ready', 'selection-ready');

    expect(
      resolveLockInEnablement(
        [
          block('ready', {
            selection: savedSelection(),
          }),
        ],
        ['ready'],
        RUNTIME_ACCESS,
      ).kind,
    ).toBe('allowed');
  });

  it('requires runtime access before treating an enabled website rule as ready', () => {
    expect(
      resolveLockInEnablement([block('website')], ['website'], {
        dailyBudgets: 'authorized',
        websiteBlocking: 'denied',
      }).kind,
    ).toBe('blocked');
  });
});
