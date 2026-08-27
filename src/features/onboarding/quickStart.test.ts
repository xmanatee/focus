import { describe, expect, it } from 'vitest';
import { resolveQuickStartPhase } from './quickStart';

describe('resolveQuickStartPhase', () => {
  it('prepares restricted settings before requesting sideloaded APK access', () => {
    expect(
      resolveQuickStartPhase({
        authorization: {
          setupStep: 'restrictedSettings',
          status: 'notDetermined',
        },
        blockCount: 0,
        missingDeviceSelectionCount: 0,
        unsupportedEnabledBlockCount: 0,
      }),
    ).toBe('prepareRestrictedSettings');
  });

  it('starts with Screen Time access when authorization is missing', () => {
    expect(
      resolveQuickStartPhase({
        authorization: {
          setupStep: 'authorizationSettings',
          status: 'notDetermined',
        },
        blockCount: 0,
        missingDeviceSelectionCount: 0,
        unsupportedEnabledBlockCount: 0,
      }),
    ).toBe('grantAccess');
  });

  it('opens settings when Screen Time access was denied', () => {
    expect(
      resolveQuickStartPhase({
        authorization: {
          setupStep: 'authorizationSettings',
          status: 'denied',
        },
        blockCount: 0,
        missingDeviceSelectionCount: 0,
        unsupportedEnabledBlockCount: 0,
      }),
    ).toBe('openSettings');
  });

  it('asks for the first block after Screen Time access is ready', () => {
    expect(
      resolveQuickStartPhase({
        authorization: {
          setupStep: 'authorizationSettings',
          status: 'authorized',
        },
        blockCount: 0,
        missingDeviceSelectionCount: 0,
        unsupportedEnabledBlockCount: 0,
      }),
    ).toBe('createFirstBlock');
  });

  it('routes synced blocks through per-device app selection', () => {
    expect(
      resolveQuickStartPhase({
        authorization: {
          setupStep: 'authorizationSettings',
          status: 'authorized',
        },
        blockCount: 2,
        missingDeviceSelectionCount: 1,
        unsupportedEnabledBlockCount: 0,
      }),
    ).toBe('finishDevice');
  });

  it('routes unsupported enabled synced blocks through device setup', () => {
    expect(
      resolveQuickStartPhase({
        authorization: {
          setupStep: 'authorizationSettings',
          status: 'authorized',
        },
        blockCount: 2,
        missingDeviceSelectionCount: 0,
        unsupportedEnabledBlockCount: 1,
      }),
    ).toBe('finishDevice');
  });

  it('stays hidden once the device is ready to use', () => {
    expect(
      resolveQuickStartPhase({
        authorization: {
          setupStep: 'authorizationSettings',
          status: 'authorized',
        },
        blockCount: 1,
        missingDeviceSelectionCount: 0,
        unsupportedEnabledBlockCount: 0,
      }),
    ).toBeNull();
  });
});
