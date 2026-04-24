import { describe, expect, it } from 'vitest';
import { formatCountdown } from './useSessionCountdown';

describe('formatCountdown', () => {
  it.each([
    [0, '00:00'],
    [1, '00:01'],
    [59, '00:59'],
    [60, '01:00'],
    [61, '01:01'],
    [1500, '25:00'],
    [5400, '90:00'],
  ])('formats %d seconds as %s', (input, expected) => {
    expect(formatCountdown(input)).toBe(expected);
  });

  it('floors fractional seconds', () => {
    expect(formatCountdown(59.9)).toBe('00:59');
  });

  it('clamps negatives to zero', () => {
    expect(formatCountdown(-10)).toBe('00:00');
  });
});
