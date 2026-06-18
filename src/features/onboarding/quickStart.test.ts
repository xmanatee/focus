import { describe, expect, it } from 'vitest';
import { resolveQuickStartPhase } from './quickStart';

describe('resolveQuickStartPhase', () => {
  it('starts with Screen Time access when authorization is missing', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'notDetermined',
        blockCount: 0,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('grantAccess');
  });

  it('opens settings when Screen Time access was denied', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'denied',
        blockCount: 0,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('openSettings');
  });

  it('asks for the first block after Screen Time access is ready', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        blockCount: 0,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('createFirstBlock');
  });

  it('routes synced blocks through per-device app selection', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        blockCount: 2,
        missingDeviceSelectionCount: 1,
      }),
    ).toBe('finishDevice');
  });

  it('stays hidden once the device is ready to use', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        blockCount: 1,
        missingDeviceSelectionCount: 0,
      }),
    ).toBeNull();
  });
});
