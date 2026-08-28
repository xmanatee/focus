import { describe, expect, test } from 'vitest';

import { extractArtifactUrl, extractBuildId } from './eas-build-output.mjs';

describe('extractBuildId', () => {
  test('returns the single successful build ID', () => {
    expect(
      extractBuildId(
        [{ id: 'build-123', platform: 'ANDROID', status: 'FINISHED' }],
        'ANDROID',
      ),
    ).toBe('build-123');
  });

  test('supports exact iOS submission selection', () => {
    expect(
      extractBuildId(
        [{ id: 'build-ios', platform: 'IOS', status: 'FINISHED' }],
        'IOS',
      ),
    ).toBe('build-ios');
  });

  test.each([
    { builds: [], platform: 'ANDROID' },
    {
      builds: [
        { id: 'one', platform: 'ANDROID', status: 'FINISHED' },
        { id: 'two', platform: 'ANDROID', status: 'FINISHED' },
      ],
      platform: 'ANDROID',
    },
    {
      builds: [{ id: 'build', platform: 'IOS', status: 'FINISHED' }],
      platform: 'ANDROID',
    },
    {
      builds: [{ id: 'build', platform: 'ANDROID', status: 'ERRORED' }],
      platform: 'ANDROID',
    },
    {
      builds: [{ id: '', platform: 'ANDROID', status: 'FINISHED' }],
      platform: 'ANDROID',
    },
  ])('rejects invalid build output %#', ({ builds, platform }) => {
    expect(() => extractBuildId(builds, platform)).toThrow();
  });

  test('rejects unsupported platforms', () => {
    expect(() => extractBuildId([], 'WEB')).toThrow('Unsupported EAS platform');
  });
});

describe('extractArtifactUrl', () => {
  test('returns the canonical Android artifact URL', () => {
    expect(
      extractArtifactUrl(
        [
          {
            id: 'build-123',
            platform: 'ANDROID',
            status: 'FINISHED',
            artifacts: {
              applicationArchiveUrl:
                'https://expo.dev/artifacts/focus-build.apk',
            },
          },
        ],
        'ANDROID',
        '.apk',
      ),
    ).toBe('https://expo.dev/artifacts/focus-build.apk');
  });

  test.each([
    {},
    { artifacts: {} },
    { artifacts: { applicationArchiveUrl: '' } },
    {
      artifacts: {
        applicationArchiveUrl: 'http://expo.dev/artifacts/focus-build.apk',
      },
    },
    {
      artifacts: {
        applicationArchiveUrl: 'https://expo.dev/artifacts/focus-build.aab',
      },
    },
  ])('rejects invalid APK output %#', (artifactFields) => {
    const builds = [
      {
        id: 'build-123',
        platform: 'ANDROID',
        status: 'FINISHED',
        ...artifactFields,
      },
    ];
    expect(() => extractArtifactUrl(builds, 'ANDROID', '.apk')).toThrow();
  });

  test('rejects unsupported artifact extensions', () => {
    expect(() =>
      extractArtifactUrl(
        [
          {
            id: 'build-123',
            platform: 'ANDROID',
            status: 'FINISHED',
          },
        ],
        'ANDROID',
        '.zip',
      ),
    ).toThrow('Unsupported Android artifact');
  });
});
