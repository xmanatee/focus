import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const NATIVE_SHARED_FILES = [
  'targets/ActivityMonitorExtension/Shared.swift',
  'targets/ShieldAction/Shared.swift',
  'targets/ShieldConfiguration/Shared.swift',
] as const;

const REQUIRED_CUSTOM_ACTIONS = ['addWebContentFilterDomains'] as const;
const REQUIRED_CUSTOM_HELPERS = [
  'func addWebContentFilterDomains',
  'func webContentFilterDomainsFromLastUpdateMetadata',
] as const;

describe('native action parity', () => {
  it('handles every custom scheduler action in each native extension', () => {
    for (const file of NATIVE_SHARED_FILES) {
      const source = readFileSync(join(process.cwd(), file), 'utf8');
      for (const action of REQUIRED_CUSTOM_ACTIONS) {
        expect(source).toContain(`type == "${action}"`);
      }

      for (const helper of REQUIRED_CUSTOM_HELPERS) {
        expect(source).toContain(helper);
      }
    }
  });
});
