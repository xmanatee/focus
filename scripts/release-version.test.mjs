import { describe, expect, test } from 'vitest';

import { createReleasePlan } from './release-version.mjs';

const release = (version, build) => ({
  version,
  iosBuildNumber: build,
  androidVersionCode: build,
});

describe('createReleasePlan', () => {
  test('skips a push whose release identity did not change', () => {
    expect(
      createReleasePlan(release('1.0.5', 15), release('1.0.5', 15)),
    ).toEqual({ shouldRelease: false });
  });

  test.each([
    ['1.0.6', '1.0.5'],
    ['1.1.0', '1.0.9'],
    ['2.0.0', '1.99.99'],
    ['1.10.0', '1.9.9'],
  ])('releases increasing version %s after %s', (current, previous) => {
    expect(
      createReleasePlan(release(current, 16), release(previous, 15)),
    ).toEqual({
      shouldRelease: true,
      releaseTag: `v${current}`,
    });
  });

  test.each([
    ['1.0.4', '1.0.5'],
    ['1.9.9', '1.10.0'],
    ['1.0.0', '2.0.0'],
  ])('rejects decreasing version %s after %s', (current, previous) => {
    expect(() =>
      createReleasePlan(release(current, 16), release(previous, 15)),
    ).toThrow('must be greater');
  });

  test.each([
    ['1.0', '1.0.0'],
    ['1.0.0-beta.1', '1.0.0'],
    ['01.0.0', '1.0.0'],
    ['1.0.0', 'latest'],
  ])('rejects invalid versions %s and %s', (current, previous) => {
    expect(() =>
      createReleasePlan(release(current, 16), release(previous, 15)),
    ).toThrow('stable semantic version');
  });

  test.each([
    ['iOS build number', { iosBuildNumber: 15 }],
    ['Android version code', { androidVersionCode: 15 }],
  ])('requires an increasing %s', (label, override) => {
    expect(() =>
      createReleasePlan(
        { ...release('1.0.6', 16), ...override },
        release('1.0.5', 15),
      ),
    ).toThrow(`${label} must be greater`);
  });

  test('rejects build-number changes without a version change', () => {
    expect(() =>
      createReleasePlan(release('1.0.5', 16), release('1.0.5', 15)),
    ).toThrow('cannot change without the release version');
  });

  test.each([
    { iosBuildNumber: 0 },
    { iosBuildNumber: 1.5 },
    { androidVersionCode: '16' },
  ])('rejects invalid build identity %#', (override) => {
    expect(() =>
      createReleasePlan(
        { ...release('1.0.6', 16), ...override },
        release('1.0.5', 15),
      ),
    ).toThrow('positive integer');
  });
});
