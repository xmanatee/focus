import type { SetupVerificationLevel } from '../diagnostics/diagnostics';

interface ReviewPromptInput {
  readonly activeBlockCount: number;
  readonly applicableBlockCount: number;
  readonly hasDismissed: boolean;
  readonly level: SetupVerificationLevel;
  readonly missingDeviceSelectionCount: number;
}

export function shouldShowReviewPrompt(input: ReviewPromptInput): boolean {
  return (
    !input.hasDismissed &&
    input.level === 'ready' &&
    input.applicableBlockCount > 0 &&
    input.activeBlockCount === 0 &&
    input.missingDeviceSelectionCount === 0
  );
}
