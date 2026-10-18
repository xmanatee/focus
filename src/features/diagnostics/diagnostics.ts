import {
  BlockerBridge,
  type BlockingAuthorizationState,
} from '../../bridge/BlockerBridge';
import type { RuntimeAccessState } from '../../bridge/BlockerBridge.types';
import type { ProtectionPosture } from '../protection/types';
import { focusBlockSelectionReadyInSlots } from '../schedule/localActivitySelection';
import { focusBlockRunnableLocally } from '../schedule/localRuntime';
import {
  missingRuntimeAccess,
  runtimeAccessRequirements,
} from '../schedule/runtimeAccess';
import { getFocusBlockRuntimeStatus } from '../schedule/runtimeStatus';
import type { FocusBlock } from '../schedule/types';
import type { SetupBlock } from '../settings/adminState';

export type SetupVerificationLevel = 'ready' | 'attention' | 'blocked';
export type SetupVerificationStatus = 'pass' | 'warn' | 'fail';
export type SetupVerificationAction =
  | 'addBlock'
  | 'finishDeviceSetup'
  | 'openDiagnostics'
  | 'openProtection'
  | 'requestBlockingAccess'
  | 'requestDailyBudgetAccess'
  | 'requestWebsiteBlockingAccess';

export interface SetupVerificationCheck {
  readonly id:
    | 'blockingAccess'
    | 'blocks'
    | 'deviceSelections'
    | 'dailyBudgetAccess'
    | 'websiteBlockingAccess'
    | 'protection'
    | 'activeNow';
  readonly title: string;
  readonly detail: string;
  readonly status: SetupVerificationStatus;
}

export function setupActionForCheck(
  id: SetupVerificationCheck['id'],
): SetupVerificationAction {
  switch (id) {
    case 'blockingAccess':
      return 'requestBlockingAccess';
    case 'dailyBudgetAccess':
      return 'requestDailyBudgetAccess';
    case 'websiteBlockingAccess':
      return 'requestWebsiteBlockingAccess';
    case 'activeNow':
      return 'openDiagnostics';
    case 'blocks':
      return 'addBlock';
    case 'deviceSelections':
      return 'finishDeviceSetup';
    case 'protection':
      return 'openProtection';
  }
}

export interface DiagnosticsInput {
  readonly authorization: BlockingAuthorizationState;
  readonly runtimeAccess: RuntimeAccessState;
  readonly enabledBlockIds: readonly string[];
  readonly focusBlocks: readonly FocusBlock[];
  readonly now: Date;
  readonly populatedSelectionSlots: ReadonlySet<string>;
  readonly posture: ProtectionPosture;
  readonly setupBlock: SetupBlock | null;
  readonly setupBlockEnabledOnDevice: boolean;
}

export interface SetupVerification {
  readonly activeBlockCount: number;
  readonly blockCount: number;
  readonly checks: readonly SetupVerificationCheck[];
  readonly level: SetupVerificationLevel;
  readonly missingDeviceSelectionCount: number;
  readonly missingRuntimeAccessCount: number;
  readonly summary: string;
  readonly title: string;
}

function statusLevel(
  checks: readonly SetupVerificationCheck[],
): SetupVerificationLevel {
  if (checks.some((check) => check.status === 'fail')) return 'blocked';
  if (checks.some((check) => check.status === 'warn')) return 'attention';
  return 'ready';
}

function titleFor(level: SetupVerificationLevel): string {
  if (level === 'blocked') return 'Needs setup';
  if (level === 'attention') return 'Worth checking';
  return 'Ready';
}

function summaryFor(level: SetupVerificationLevel): string {
  if (level === 'blocked') {
    return 'One or more blocks cannot apply correctly on this device yet.';
  }
  if (level === 'attention') {
    return 'Core blocking can work, but one setup item would make it stronger.';
  }
  return `${BlockerBridge.capabilities.authorizationAccessName} and local selections look ready.`;
}

function missingSelectionDetail(count: number): string {
  if (count === 0) return 'Selections are present';
  return `${count} enabled ${
    count === 1 ? 'block needs' : 'blocks need'
  } apps picked here`;
}

function accessDetail(
  status: RuntimeAccessState[keyof RuntimeAccessState],
): string {
  if (status === 'authorized') return 'Authorized';
  if (status === 'denied') return 'Access is off in system settings';
  return 'Access has not been granted yet';
}

export function evaluateSetupVerification(
  input: DiagnosticsInput,
): SetupVerification {
  const locallyEnabled = input.focusBlocks.filter((block) =>
    input.enabledBlockIds.includes(block.id),
  );
  const missingDeviceSelectionCount = locallyEnabled.filter(
    (block) =>
      !focusBlockSelectionReadyInSlots(block, input.populatedSelectionSlots),
  ).length;
  const missingRuntimeAccessCount = locallyEnabled.filter(
    (block) => missingRuntimeAccess(block, input.runtimeAccess).length > 0,
  ).length;
  const runnable = input.focusBlocks.map((block) => {
    const selectionReady = focusBlockSelectionReadyInSlots(
      block,
      input.populatedSelectionSlots,
    );
    return focusBlockRunnableLocally(
      block,
      input.enabledBlockIds.includes(block.id),
      selectionReady,
      missingRuntimeAccess(block, input.runtimeAccess).length === 0,
    );
  });
  const enabled = runnable.filter((block) => block.isEnabled);
  const activeBlockCount = enabled.filter(
    (block) => getFocusBlockRuntimeStatus(block, input.now).kind === 'active',
  ).length;
  const requiresBudgetAccess = locallyEnabled.some((block) =>
    runtimeAccessRequirements(block).includes('dailyBudgets'),
  );
  const requiresWebsiteAccess = locallyEnabled.some((block) =>
    runtimeAccessRequirements(block).includes('websiteBlocking'),
  );

  const checks: SetupVerificationCheck[] = [
    {
      id: 'blockingAccess',
      title: BlockerBridge.capabilities.authorizationAccessName,
      detail:
        input.authorization.status === 'authorized'
          ? 'Authorized'
          : input.authorization.setupStep === 'restrictedSettings'
            ? 'Allow restricted settings in App info'
            : input.authorization.status === 'denied'
              ? BlockerBridge.capabilities.deniedAuthorizationDetail
              : 'Permission has not been granted yet',
      status: input.authorization.status === 'authorized' ? 'pass' : 'fail',
    },
    {
      id: 'blocks',
      title: 'Enabled blocks',
      detail:
        locallyEnabled.length === 0
          ? 'No blocks are enabled on this device'
          : `${locallyEnabled.length} enabled on this device`,
      status: locallyEnabled.length === 0 ? 'warn' : 'pass',
    },
    {
      id: 'deviceSelections',
      title: 'Local app selections',
      detail: missingSelectionDetail(missingDeviceSelectionCount),
      status: missingDeviceSelectionCount === 0 ? 'pass' : 'fail',
    },
  ];
  if (requiresBudgetAccess) {
    checks.push({
      id: 'dailyBudgetAccess',
      title: 'Usage measurement',
      detail: accessDetail(input.runtimeAccess.dailyBudgets),
      status:
        input.runtimeAccess.dailyBudgets === 'authorized' ? 'pass' : 'fail',
    });
  }
  if (requiresWebsiteAccess) {
    checks.push({
      id: 'websiteBlockingAccess',
      title: 'Website filtering',
      detail: accessDetail(input.runtimeAccess.websiteBlocking),
      status:
        input.runtimeAccess.websiteBlocking === 'authorized' ? 'pass' : 'fail',
    });
  }
  checks.push(
    {
      id: 'protection',
      title: 'Lock-in defenses',
      detail: BlockerBridge.capabilities.supportsSystemTamperProtection
        ? input.posture.score === 'full'
          ? 'Deletion and access defenses confirmed'
          : 'Optional system defenses are not fully confirmed'
        : 'In-app edit protection is available',
      status:
        !BlockerBridge.capabilities.supportsSystemTamperProtection ||
        input.posture.score === 'full'
          ? 'pass'
          : 'warn',
    },
    {
      id: 'activeNow',
      title: 'Active right now',
      detail:
        activeBlockCount === 0
          ? 'No block is due at this moment'
          : `${activeBlockCount} block should be shielding now`,
      status: 'pass',
    },
  );

  const level = statusLevel(checks);
  return {
    activeBlockCount,
    blockCount: input.focusBlocks.length,
    checks,
    level,
    missingDeviceSelectionCount,
    missingRuntimeAccessCount,
    summary: summaryFor(level),
    title: titleFor(level),
  };
}
