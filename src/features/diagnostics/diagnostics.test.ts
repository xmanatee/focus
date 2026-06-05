import { describe, expect, it } from 'vitest';
import { focusBlockInput } from '../../test-helpers/focusBlockFixtures';
import type { ProtectionPosture } from '../protection/types';
import type { FocusBlock } from '../schedule/types';
import {
  buildDiagnosticsReport,
  evaluateSetupVerification,
  setupActionForCheck,
} from './diagnostics';

const FULL_POSTURE: ProtectionPosture = {
  completedAt: 100,
  defenses: [
    { id: 'screenTimeLock', ok: true },
    { id: 'appDeletion', ok: true },
  ],
  score: 'full',
};

function block(id: string, overrides: Partial<FocusBlock> = {}): FocusBlock {
  return {
    ...focusBlockInput({
      selection: {
        activitySelection: {
          applicationCount: 1,
          categoryCount: 0,
          includeEntireCategory: true,
          status: 'saved',
          webDomainCount: 0,
        },
        webDomains: ['youtube.com'],
      },
    }),
    id,
    ...overrides,
  };
}

describe('evaluateSetupVerification', () => {
  it('flags synced all-device blocks that need local app selection', () => {
    const result = evaluateSetupVerification({
      authorizationStatus: 'authorized',
      deviceId: 'device-a',
      focusBlocks: [block('one')],
      now: new Date('2026-06-05T10:00:00'),
      populatedSelectionSlots: new Set(),
      posture: FULL_POSTURE,
      setupBlock: null,
    });

    expect(result.level).toBe('blocked');
    expect(result.missingDeviceSelectionCount).toBe(1);
    expect(result.checks).toContainEqual(
      expect.objectContaining({
        id: 'deviceSelections',
        status: 'fail',
      }),
    );
  });

  it('reports ready when permissions and device selections are complete', () => {
    const result = evaluateSetupVerification({
      authorizationStatus: 'authorized',
      deviceId: 'device-a',
      focusBlocks: [block('one')],
      now: new Date('2026-06-05T10:00:00'),
      populatedSelectionSlots: new Set(['block.one']),
      posture: FULL_POSTURE,
      setupBlock: null,
    });

    expect(result.level).toBe('ready');
    expect(result.missingDeviceSelectionCount).toBe(0);
  });

  it('maps failed setup checks to concrete repair actions', () => {
    expect(setupActionForCheck('screenTime')).toBe('requestScreenTime');
    expect(setupActionForCheck('deviceSelections')).toBe('finishDeviceSetup');
    expect(setupActionForCheck('protection')).toBe('openProtection');
    expect(setupActionForCheck('blocks')).toBe('addBlock');
    expect(setupActionForCheck('activeNow')).toBe('openDiagnostics');
  });
});

describe('buildDiagnosticsReport', () => {
  it('exports counts and statuses without private target names', () => {
    const report = buildDiagnosticsReport({
      appVersion: '1.0.1',
      authorizationStatus: 'authorized',
      deviceId: 'device-a',
      focusBlocks: [block('one', { name: 'Secret YouTube Block' })],
      generatedAt: new Date('2026-06-05T10:00:00Z'),
      now: new Date('2026-06-05T10:00:00'),
      populatedSelectionSlots: new Set(['block.one']),
      posture: FULL_POSTURE,
      setupBlock: null,
    });

    expect(report).toContain('Focus Blocks Diagnostics');
    expect(report).toContain('Version: 1.0.1');
    expect(report).toContain('Blocks: 1');
    expect(report).toContain('Block 1');
    expect(report).toContain('webDomains=1');
    expect(report).not.toContain('Secret YouTube Block');
    expect(report).not.toContain('youtube.com');
  });
});
