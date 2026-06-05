import type { AuthorizationStatus } from '../../bridge/BlockerBridge';

export type QuickStartPhase =
  | 'grantAccess'
  | 'openSettings'
  | 'createFirstBlock'
  | 'finishDevice'
  | 'verifySetup'
  | 'complete';

interface QuickStartInput {
  readonly authorizationStatus: AuthorizationStatus;
  readonly blockCount: number;
  readonly hasCompletedQuickStart: boolean;
  readonly missingDeviceSelectionCount: number;
}

export function resolveQuickStartPhase(
  input: QuickStartInput,
): QuickStartPhase {
  if (input.authorizationStatus === 'denied') return 'openSettings';
  if (input.authorizationStatus !== 'authorized') return 'grantAccess';
  if (input.blockCount === 0) return 'createFirstBlock';
  if (input.missingDeviceSelectionCount > 0) return 'finishDevice';
  return input.hasCompletedQuickStart ? 'complete' : 'verifySetup';
}
