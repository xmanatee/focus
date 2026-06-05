import { describe, expect, it } from 'vitest';
import { shouldShowReviewPrompt } from './reviewEligibility';

describe('shouldShowReviewPrompt', () => {
  it('waits until setup is ready and no block is actively shielding', () => {
    expect(
      shouldShowReviewPrompt({
        activeBlockCount: 0,
        applicableBlockCount: 1,
        hasDismissed: false,
        level: 'ready',
        missingDeviceSelectionCount: 0,
      }),
    ).toBe(true);

    expect(
      shouldShowReviewPrompt({
        activeBlockCount: 1,
        applicableBlockCount: 1,
        hasDismissed: false,
        level: 'ready',
        missingDeviceSelectionCount: 0,
      }),
    ).toBe(false);
  });

  it('does not ask during setup trouble or after dismissal', () => {
    expect(
      shouldShowReviewPrompt({
        activeBlockCount: 0,
        applicableBlockCount: 1,
        hasDismissed: false,
        level: 'blocked',
        missingDeviceSelectionCount: 1,
      }),
    ).toBe(false);

    expect(
      shouldShowReviewPrompt({
        activeBlockCount: 0,
        applicableBlockCount: 1,
        hasDismissed: true,
        level: 'ready',
        missingDeviceSelectionCount: 0,
      }),
    ).toBe(false);
  });
});
