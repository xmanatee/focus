import { describe, expect, it, vi } from 'vitest';
import { focusBlockInput } from '../../test-helpers/focusBlockFixtures';
import { focusBlockUnsupportedReason } from './runtimeSupport';

vi.mock('../../bridge/BlockerBridge', () => ({
  BlockerBridge: {
    capabilities: {
      authorizationAccessName: 'Android blocking access',
      supportsAppCategories: false,
      supportsDailyBudgets: false,
      supportsWebsiteBlocking: false,
    },
  },
}));

describe('focusBlockUnsupportedReason', () => {
  it('accepts schedule-based app blocks for Android runtime', () => {
    expect(
      focusBlockUnsupportedReason(
        focusBlockInput({
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
        }),
      ),
    ).toBeNull();
  });

  it('rejects enabled Android runtime inputs that cannot be enforced there', () => {
    expect(focusBlockUnsupportedReason(focusBlockInput())).toContain(
      'Website blocking is not available',
    );
    expect(
      focusBlockUnsupportedReason(
        focusBlockInput({
          rule: { kind: 'dailyBudget', minutes: 30 },
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
        }),
      ),
    ).toContain('Daily budgets are not available');
    expect(
      focusBlockUnsupportedReason(
        focusBlockInput({
          selection: {
            activitySelection: {
              applicationCount: 0,
              categoryCount: 1,
              includeEntireCategory: true,
              status: 'saved',
              webDomainCount: 0,
            },
            webDomains: [],
          },
        }),
      ),
    ).toContain('App category blocking is not available');
  });
});
