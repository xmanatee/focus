import type { AuthorizationStatus } from '../../bridge/BlockerBridge';
import type { ProtectionPosture } from '../protection/types';
import { focusBlockSelectionReadyInSlots } from '../schedule/localActivitySelection';
import { focusBlockRunnableLocally } from '../schedule/localRuntime';
import { getFocusBlockRuntimeStatus } from '../schedule/runtimeStatus';
import type { FocusBlock } from '../schedule/types';
import { type SetupBlock, resolveAdminState } from '../settings/adminState';

export type SetupVerificationLevel = 'ready' | 'attention' | 'blocked';
export type SetupVerificationStatus = 'pass' | 'warn' | 'fail';
export type SetupVerificationAction =
  | 'addBlock'
  | 'finishDeviceSetup'
  | 'openDiagnostics'
  | 'openProtection'
  | 'requestScreenTime';

export interface SetupVerificationCheck {
  readonly id:
    | 'screenTime'
    | 'blocks'
    | 'deviceSelections'
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
    case 'screenTime':
      return 'requestScreenTime';
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
  readonly appVersion?: string;
  readonly authorizationStatus: AuthorizationStatus;
  readonly enabledBlockIds: readonly string[];
  readonly focusBlocks: readonly FocusBlock[];
  readonly generatedAt?: Date;
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
  return 'Screen Time access and local app selections look ready.';
}

function missingSelectionDetail(count: number): string {
  if (count === 0) return 'Selections are present';
  return `${count} enabled ${
    count === 1 ? 'block needs' : 'blocks need'
  } apps picked here`;
}

export function evaluateSetupVerification(
  input: DiagnosticsInput,
): SetupVerification {
  const missingDeviceSelectionCount = input.focusBlocks.filter(
    (block) =>
      input.enabledBlockIds.includes(block.id) &&
      !focusBlockSelectionReadyInSlots(block, input.populatedSelectionSlots),
  ).length;
  const runnable = input.focusBlocks.map((block) =>
    focusBlockRunnableLocally(
      block,
      input.enabledBlockIds.includes(block.id) &&
        focusBlockSelectionReadyInSlots(block, input.populatedSelectionSlots),
      focusBlockSelectionReadyInSlots(block, input.populatedSelectionSlots),
    ),
  );
  const enabled = runnable.filter((block) => block.isEnabled);
  const activeBlockCount = enabled.filter(
    (block) => getFocusBlockRuntimeStatus(block, input.now).kind === 'active',
  ).length;

  const checks: SetupVerificationCheck[] = [
    {
      id: 'screenTime',
      title: 'Screen Time access',
      detail:
        input.authorizationStatus === 'authorized'
          ? 'Authorized'
          : input.authorizationStatus === 'denied'
            ? 'Denied in iOS Settings'
            : 'Permission has not been granted yet',
      status: input.authorizationStatus === 'authorized' ? 'pass' : 'fail',
    },
    {
      id: 'blocks',
      title: 'Enabled blocks',
      detail:
        enabled.length === 0
          ? 'No blocks are enabled on this device'
          : `${enabled.length} enabled on this device`,
      status: enabled.length === 0 ? 'warn' : 'pass',
    },
    {
      id: 'deviceSelections',
      title: 'Local app selections',
      detail: missingSelectionDetail(missingDeviceSelectionCount),
      status: missingDeviceSelectionCount === 0 ? 'pass' : 'fail',
    },
    {
      id: 'protection',
      title: 'Lock-in defenses',
      detail:
        input.posture.score === 'full'
          ? 'Deletion and Screen Time defenses confirmed'
          : 'Optional defenses are not fully confirmed',
      status: input.posture.score === 'full' ? 'pass' : 'warn',
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
  ];

  const level = statusLevel(checks);
  return {
    activeBlockCount,
    blockCount: input.focusBlocks.length,
    checks,
    level,
    missingDeviceSelectionCount,
    summary: summaryFor(level),
    title: titleFor(level),
  };
}

function diagnosticsLockInState(input: DiagnosticsInput): string {
  if (input.setupBlock === null) return 'notConfigured';

  const state = resolveAdminState(
    input.setupBlock,
    input.setupBlockEnabledOnDevice,
    input.now,
  );

  if (state.kind === 'locked') return 'locked';
  if (state.reason === 'inside-block') return 'editableWindow';
  if (state.reason === 'disabled-on-device') return 'offOnThisDevice';
  return 'editableAlways';
}

export function buildDiagnosticsReport(input: DiagnosticsInput): string {
  const generatedAt = input.generatedAt ?? new Date();
  const verification = evaluateSetupVerification(input);
  const lines = [
    'Focus Blocks Diagnostics',
    `Generated: ${generatedAt.toISOString()}`,
    `Version: ${input.appVersion ?? 'unknown'}`,
    `Screen Time: ${input.authorizationStatus}`,
    `Protection: ${input.posture.score}`,
    `Lock-in: ${diagnosticsLockInState(input)}`,
    `Blocks: ${input.focusBlocks.length}`,
    `Synced blocks: ${verification.blockCount}`,
    `Missing device selections: ${verification.missingDeviceSelectionCount}`,
    '',
    'Setup checks:',
    ...verification.checks.map(
      (check) => `- ${check.title}: ${check.status} (${check.detail})`,
    ),
    '',
    'Blocks:',
  ];

  input.focusBlocks.forEach((block, index) => {
    const activity = block.selection.activitySelection;
    const selectionReady = focusBlockSelectionReadyInSlots(
      block,
      input.populatedSelectionSlots,
    );
    const runnableBlock = focusBlockRunnableLocally(
      block,
      input.enabledBlockIds.includes(block.id) && selectionReady,
      selectionReady,
    );
    const runtime = getFocusBlockRuntimeStatus(runnableBlock, input.now);
    lines.push(
      [
        `Block ${index + 1}:`,
        `enabledHere=${runnableBlock.isEnabled}`,
        `localActivation=${input.enabledBlockIds.includes(block.id)}`,
        `rule=${block.rule.kind}`,
        `days=${block.days.length}`,
        `schedule=${block.startTime}-${block.endTime}`,
        `apps=${activity.status === 'saved' ? activity.applicationCount : 0}`,
        `categories=${
          activity.status === 'saved' ? activity.categoryCount : 0
        }`,
        `webDomains=${block.selection.webDomains.length}`,
        `deviceSelection=${selectionReady}`,
        `runtime=${runtime.kind}`,
      ].join(' '),
    );
  });

  return `${lines.join('\n')}\n`;
}
