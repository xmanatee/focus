import { createRequire } from 'node:module';
import { describe, expect, test } from 'vitest';

import { metadataPushOutputHasUploadErrors } from './run-eas-metadata-push.mjs';

const require = createRequire(import.meta.url);

describe('metadataPushOutputHasUploadErrors', () => {
  test('detects EAS metadata upload summary errors', () => {
    const output = `
      Store configuration upload encountered 3 errors.

      The request cannot be fulfilled because of the state of another resource.
    `;

    expect(metadataPushOutputHasUploadErrors(output)).toBe(true);
  });

  test('detects failed App Store resource operations', () => {
    const output = `
      - Creating localized version for en-US...
      Failed creating localized version for en-US
      - Updating app categories...
    `;

    expect(metadataPushOutputHasUploadErrors(output)).toBe(true);
  });

  test('allows a clean EAS metadata upload', () => {
    const output = `
      Uploading App Store configuration...
      - Updating version and release info for 1.0.2...
      Updated version and release info for 1.0.2
      - Skipped app clip, not configured
    `;

    expect(metadataPushOutputHasUploadErrors(output)).toBe(false);
  });
});

describe('store metadata version', () => {
  test('matches the app release version', () => {
    process.env.APPLE_REVIEW_FIRST_NAME = 'App';
    process.env.APPLE_REVIEW_LAST_NAME = 'Review';
    process.env.APPLE_REVIEW_EMAIL = 'review@example.com';
    process.env.APPLE_REVIEW_PHONE = '+15555550123';

    const packageJson = require('../package.json');
    const appJson = require('../app.json');
    const storeConfig = require('../store.config.js')();

    expect(storeConfig.apple.version).toBe(packageJson.version);
    expect(storeConfig.apple.version).toBe(appJson.expo.version);
  });
});
