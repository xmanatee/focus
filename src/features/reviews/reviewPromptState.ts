import type { SetupVerification } from '../diagnostics/diagnostics';

const REVIEW_PROMPT_SNOOZE_MS = 21 * 24 * 60 * 60 * 1000;
const MINIMUM_COMPLETED_WINDOWS = 3;

export type ReviewPromptState =
  | { readonly kind: 'eligible' }
  | { readonly kind: 'snoozed'; readonly until: number }
  | { readonly kind: 'reviewed'; readonly at: number };

export function parseReviewPromptState(raw: string | null): ReviewPromptState {
  if (raw === null) {
    return { kind: 'eligible' };
  }

  const parsed = JSON.parse(raw) as ReviewPromptState;
  switch (parsed.kind) {
    case 'eligible':
      return parsed;
    case 'snoozed':
      if (
        typeof parsed.until !== 'number' ||
        !Number.isFinite(parsed.until) ||
        parsed.until <= 0
      ) {
        throw new Error('Invalid review prompt snooze state.');
      }
      return parsed;
    case 'reviewed':
      if (
        typeof parsed.at !== 'number' ||
        !Number.isFinite(parsed.at) ||
        parsed.at <= 0
      ) {
        throw new Error('Invalid review prompt reviewed state.');
      }
      return parsed;
    default:
      throw new Error('Invalid review prompt state.');
  }
}

export function serializeReviewPromptState(state: ReviewPromptState): string {
  return JSON.stringify(state);
}

export function shouldShowReviewPrompt(
  verification: SetupVerification,
  completedScheduledWindowCount: number,
  promptState: ReviewPromptState,
  nowMs: number,
): boolean {
  if (promptState.kind === 'reviewed') {
    return false;
  }

  if (promptState.kind === 'snoozed' && promptState.until > nowMs) {
    return false;
  }

  return (
    verification.level === 'ready' &&
    verification.blockCount > 0 &&
    verification.activeBlockCount === 0 &&
    completedScheduledWindowCount >= MINIMUM_COMPLETED_WINDOWS &&
    verification.missingDeviceSelectionCount === 0 &&
    verification.unsupportedEnabledBlockCount === 0
  );
}

export function snoozeReviewPrompt(nowMs: number): ReviewPromptState {
  return {
    kind: 'snoozed',
    until: nowMs + REVIEW_PROMPT_SNOOZE_MS,
  };
}

export function markReviewPromptReviewed(nowMs: number): ReviewPromptState {
  return {
    kind: 'reviewed',
    at: nowMs,
  };
}
