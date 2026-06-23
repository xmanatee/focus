import { describe, expect, it } from 'vitest';
import { validateSetupBlock } from './validation';

describe('validateSetupBlock', () => {
  it('rejects setup windows shorter than iOS can monitor', () => {
    expect(() =>
      validateSetupBlock({
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        startTime: '09:00',
        endTime: '09:03',
      }),
    ).toThrow(/15 minutes/i);
  });

  it('accepts a 15-minute setup window', () => {
    expect(() =>
      validateSetupBlock({
        days: ['sun'],
        startTime: '09:00',
        endTime: '09:15',
      }),
    ).not.toThrow();
  });
});
