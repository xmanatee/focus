import type { AuthorizationStatus } from '../../bridge/BlockerBridge';

export type QuickStartPhase =
  | 'grantAccess'
  | 'openSettings'
  | 'prepareDevice'
  | 'createFirstBlock'
  | 'finishDevice';

interface QuickStartInput {
  readonly authorizationStatus: AuthorizationStatus;
  readonly applicableBlockCount: number;
  readonly deviceId: string | null;
  readonly missingDeviceSelectionCount: number;
}

export function resolveQuickStartPhase(
  input: QuickStartInput,
): QuickStartPhase | null {
  if (input.authorizationStatus === 'denied') return 'openSettings';
  if (input.authorizationStatus !== 'authorized') return 'grantAccess';
  if (input.deviceId === null) return 'prepareDevice';
  if (input.applicableBlockCount === 0) return 'createFirstBlock';
  if (input.missingDeviceSelectionCount > 0) return 'finishDevice';
  return null;
}
