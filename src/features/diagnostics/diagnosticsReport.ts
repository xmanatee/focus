import { BlockerBridge } from '../../bridge/BlockerBridge';
import { focusBlockSelectionReadyInSlots } from '../schedule/localActivitySelection';
import { focusBlockRunnableLocally } from '../schedule/localRuntime';
import { missingRuntimeAccess } from '../schedule/runtimeAccess';
import { getFocusBlockRuntimeStatus } from '../schedule/runtimeStatus';
import { resolveAdminState } from '../settings/adminState';
import {
  type DiagnosticsInput,
  evaluateSetupVerification,
} from './diagnostics';

interface DiagnosticsReportInput extends DiagnosticsInput {
  readonly appVersion: string;
  readonly generatedAt: Date;
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

export function buildDiagnosticsReport(input: DiagnosticsReportInput): string {
  const verification = evaluateSetupVerification(input);
  const lines = [
    'Focus Blocks Diagnostics',
    `Generated: ${input.generatedAt.toISOString()}`,
    `Version: ${input.appVersion}`,
    `${BlockerBridge.capabilities.authorizationAccessName}: ${input.authorization.status}`,
    `Blocking access setup: ${input.authorization.setupStep}`,
    `Budget access: ${input.runtimeAccess.dailyBudgets}`,
    `Website access: ${input.runtimeAccess.websiteBlocking}`,
    `Protection: ${input.posture.score}`,
    `Lock-in: ${diagnosticsLockInState(input)}`,
    `Blocks: ${verification.blockCount}`,
    `Missing device selections: ${verification.missingDeviceSelectionCount}`,
    `Missing runtime access: ${verification.missingRuntimeAccessCount}`,
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
    const missingAccess = missingRuntimeAccess(block, input.runtimeAccess);
    const runnableBlock = focusBlockRunnableLocally(
      block,
      input.enabledBlockIds.includes(block.id),
      selectionReady,
      missingAccess.length === 0,
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
        `missingAccess=${missingAccess.join(',') || 'none'}`,
        `runtime=${runtime.kind}`,
      ].join(' '),
    );
  });

  return `${lines.join('\n')}\n`;
}
