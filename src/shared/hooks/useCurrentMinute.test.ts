import { describe, expect, it } from 'vitest';
import { millisecondsUntilNextMinute } from './useCurrentMinute';

describe('millisecondsUntilNextMinute', () => {
  it('targets the next minute boundary with timer tolerance', () => {
    expect(millisecondsUntilNextMinute(120_000)).toBe(60_050);
    expect(millisecondsUntilNextMinute(179_999)).toBe(51);
  });
});
