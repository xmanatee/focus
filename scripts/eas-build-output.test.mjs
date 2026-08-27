import { describe, expect, test } from 'vitest';

import { extractArtifactPath, extractBuildId } from './eas-build-output.mjs';

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

describe('extractArtifactPath', () => {
  test('returns an APK path', () => {
    expect(extractArtifactPath({ path: '/tmp/focus-build.apk' }, '.apk')).toBe(
      '/tmp/focus-build.apk',
    );
  });

  test.each([null, {}, { path: '' }, { path: '/tmp/focus-build.aab' }])(
    'rejects invalid APK output %#',
    (download) => {
      expect(() => extractArtifactPath(download, '.apk')).toThrow();
    },
  );
});
