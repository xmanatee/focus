import type { BlockingAuthorizationState } from '../../bridge/BlockerBridge';

export type QuickStartPhase =
  | 'prepareRestrictedSettings'
  | 'grantAccess'
  | 'openSettings'
  | 'createFirstBlock'
  | 'finishDevice';

interface QuickStartInput {
  readonly authorization: BlockingAuthorizationState;
  readonly blockCount: number;
  readonly missingDeviceSelectionCount: number;
  readonly unsupportedEnabledBlockCount: number;
}

export function resolveQuickStartPhase(
  input: QuickStartInput,
): QuickStartPhase | null {
  if (
    input.authorization.status !== 'authorized' &&
    input.authorization.setupStep === 'restrictedSettings'
  ) {
    return 'prepareRestrictedSettings';
  }
  if (input.authorization.status === 'denied') return 'openSettings';
  if (input.authorization.status !== 'authorized') return 'grantAccess';
  if (input.blockCount === 0) return 'createFirstBlock';
  if (
    input.missingDeviceSelectionCount > 0 ||
    input.unsupportedEnabledBlockCount > 0
  ) {
    return 'finishDevice';
  }
  return null;
}
