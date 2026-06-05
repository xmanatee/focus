import { describe, expect, it } from 'vitest';
import { resolveQuickStartPhase } from './quickStart';

describe('resolveQuickStartPhase', () => {
  it('starts with Screen Time access when authorization is missing', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'notDetermined',
        blockCount: 0,
        hasCompletedQuickStart: false,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('grantAccess');
  });

  it('opens settings when Screen Time access was denied', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'denied',
        blockCount: 0,
        hasCompletedQuickStart: false,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('openSettings');
  });

  it('asks for the first block after Screen Time access is ready', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        blockCount: 0,
        hasCompletedQuickStart: false,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('createFirstBlock');
  });

  it('routes synced blocks through per-device app selection', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        blockCount: 2,
        hasCompletedQuickStart: false,
        missingDeviceSelectionCount: 1,
      }),
    ).toBe('finishDevice');
  });

  it('keeps a verification step until the user completes quick start', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        blockCount: 1,
        hasCompletedQuickStart: false,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('verifySetup');
  });

  it('stays hidden after quick start is complete', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        blockCount: 1,
        hasCompletedQuickStart: true,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('complete');
  });
});
