import type { AuthorizationStatus } from '../../bridge/BlockerBridge';

export type QuickStartPhase =
  | 'grantAccess'
  | 'openSettings'
  | 'createFirstBlock'
  | 'finishDevice';

interface QuickStartInput {
  readonly authorizationStatus: AuthorizationStatus;
  readonly blockCount: number;
  readonly missingDeviceSelectionCount: number;
}

export function resolveQuickStartPhase(
  input: QuickStartInput,
): QuickStartPhase | null {
  if (input.authorizationStatus === 'denied') return 'openSettings';
  if (input.authorizationStatus !== 'authorized') return 'grantAccess';
  if (input.blockCount === 0) return 'createFirstBlock';
  if (input.missingDeviceSelectionCount > 0) return 'finishDevice';
  return null;
}
