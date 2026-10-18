import { describe, expect, it } from 'vitest';
import { focusBlockInput } from '../../test-helpers/focusBlockFixtures';
import {
  missingRuntimeAccess,
  runtimeAccessRequirements,
} from './runtimeAccess';

describe('runtime access requirements', () => {
  it('requires no supplemental access for an app schedule', () => {
    const input = focusBlockInput({
      selection: {
        activitySelection: {
          applicationCount: 1,
          categoryCount: 0,
          includeEntireCategory: false,
          status: 'saved',
          webDomainCount: 0,
        },
        webDomains: [],
      },
    });

    expect(runtimeAccessRequirements(input)).toEqual([]);
  });

  it('derives usage and VPN access from rule semantics', () => {
    const input = focusBlockInput({
      rule: { kind: 'allowDuringScheduleWithBudget', minutes: 30 },
      selection: {
        activitySelection: {
          applicationCount: 1,
          categoryCount: 0,
          includeEntireCategory: false,
          status: 'saved',
          webDomainCount: 0,
        },
        webDomains: ['youtube.com'],
      },
    });

    expect(runtimeAccessRequirements(input)).toEqual([
      'dailyBudgets',
      'websiteBlocking',
    ]);
  });

  it('reports only access that has not been granted', () => {
    const input = focusBlockInput({
      rule: { kind: 'dailyBudget', minutes: 30 },
      selection: {
        activitySelection: {
          applicationCount: 1,
          categoryCount: 0,
          includeEntireCategory: false,
          status: 'saved',
          webDomainCount: 0,
        },
        webDomains: ['youtube.com'],
      },
    });

    expect(
      missingRuntimeAccess(input, {
        dailyBudgets: 'authorized',
        websiteBlocking: 'notDetermined',
      }),
    ).toEqual(['websiteBlocking']);
  });
});
