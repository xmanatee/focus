import { describe, expect, it } from 'vitest';
import { budgetMinutesError } from './budget';

describe('budgetMinutesError', () => {
  it('accepts integer values inside the supported range', () => {
    expect(budgetMinutesError(30)).toBeNull();
  });

  it('rejects values outside the supported range', () => {
    expect(budgetMinutesError(0)).toBe(
      'Daily budget must be between 1 minute and 23h 59m.',
    );
    expect(budgetMinutesError(24 * 60)).toBe(
      'Daily budget must be between 1 minute and 23h 59m.',
    );
  });
});
