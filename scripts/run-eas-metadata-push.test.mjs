import { describe, expect, test } from 'vitest';

import { metadataPushOutputHasUploadErrors } from './run-eas-metadata-push.mjs';

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
      - Updating version and release info for 1.0.1...
      Updated version and release info for 1.0.1
      - Skipped app clip, not configured
    `;

    expect(metadataPushOutputHasUploadErrors(output)).toBe(false);
  });
});
