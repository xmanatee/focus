import { describe, expect, it } from 'vitest';
import {
  markReviewPromptReviewed,
  shouldShowReviewPrompt,
  snoozeReviewPrompt,
} from './reviewPromptState';

const readyVerification = {
  activeBlockCount: 0,
  blockCount: 1,
  checks: [],
  level: 'ready',
  missingDeviceSelectionCount: 0,
  summary: 'Ready',
  title: 'Ready',
} as const;

describe('shouldShowReviewPrompt', () => {
  it('waits until setup is ready and no block is actively shielding', () => {
    expect(
      shouldShowReviewPrompt(
        readyVerification,
        { kind: 'eligible' },
        Date.now(),
      ),
    ).toBe(true);

    expect(
      shouldShowReviewPrompt(
        {
          ...readyVerification,
          activeBlockCount: 1,
        },
        { kind: 'eligible' },
        Date.now(),
      ),
    ).toBe(false);
  });

  it('does not ask during setup trouble, snooze, or after review', () => {
    expect(
      shouldShowReviewPrompt(
        {
          ...readyVerification,
          level: 'blocked',
          missingDeviceSelectionCount: 1,
        },
        { kind: 'eligible' },
        Date.now(),
      ),
    ).toBe(false);

    expect(
      shouldShowReviewPrompt(
        readyVerification,
        snoozeReviewPrompt(Date.now()),
        Date.now(),
      ),
    ).toBe(false);

    expect(
      shouldShowReviewPrompt(
        readyVerification,
        markReviewPromptReviewed(Date.now()),
        Date.now(),
      ),
    ).toBe(false);
  });
});
