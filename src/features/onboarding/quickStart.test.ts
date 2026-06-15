import { describe, expect, it } from 'vitest';
import { resolveQuickStartPhase } from './quickStart';

describe('resolveQuickStartPhase', () => {
  it('starts with Screen Time access when authorization is missing', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'notDetermined',
        applicableBlockCount: 0,
        deviceId: null,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('grantAccess');
  });

  it('opens settings when Screen Time access was denied', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'denied',
        applicableBlockCount: 0,
        deviceId: null,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('openSettings');
  });

  it('waits for the local device to be ready before setup continues', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        applicableBlockCount: 0,
        deviceId: null,
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('prepareDevice');
  });

  it('asks for the first block after Screen Time access and device setup are ready', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        applicableBlockCount: 0,
        deviceId: 'device-a',
        missingDeviceSelectionCount: 0,
      }),
    ).toBe('createFirstBlock');
  });

  it('routes synced blocks through per-device app selection', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        applicableBlockCount: 2,
        deviceId: 'device-a',
        missingDeviceSelectionCount: 1,
      }),
    ).toBe('finishDevice');
  });

  it('stays hidden once the device is ready to use', () => {
    expect(
      resolveQuickStartPhase({
        authorizationStatus: 'authorized',
        applicableBlockCount: 1,
        deviceId: 'device-a',
        missingDeviceSelectionCount: 0,
      }),
    ).toBeNull();
  });
});
