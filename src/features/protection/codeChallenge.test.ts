import { describe, expect, it } from 'vitest';
import {
  EMERGENCY_INITIAL_LENGTH,
  EMERGENCY_LENGTH_INCREMENT,
  EMERGENCY_MAX_LENGTH,
  generateCode,
  nextCodeLength,
} from './codeChallenge';

const ALLOWED = /^[A-HJ-NP-Z2-9]+$/;

describe('generateCode', () => {
  it('returns a string of the requested length', () => {
    expect(generateCode(8)).toHaveLength(8);
    expect(generateCode(16)).toHaveLength(16);
    expect(generateCode(EMERGENCY_INITIAL_LENGTH)).toHaveLength(
      EMERGENCY_INITIAL_LENGTH,
    );
  });

  it('uses only the unambiguous alphabet', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateCode(20)).toMatch(ALLOWED);
    }
  });

  it('produces different codes across invocations', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      seen.add(generateCode(16));
    }
    expect(seen.size).toBeGreaterThan(15);
  });
});

describe('nextCodeLength', () => {
  it('grows by the increment', () => {
    expect(nextCodeLength(8)).toBe(8 + EMERGENCY_LENGTH_INCREMENT);
  });

  it('caps at the maximum', () => {
    expect(nextCodeLength(EMERGENCY_MAX_LENGTH)).toBe(EMERGENCY_MAX_LENGTH);
    expect(nextCodeLength(EMERGENCY_MAX_LENGTH - 1)).toBe(EMERGENCY_MAX_LENGTH);
  });
});
