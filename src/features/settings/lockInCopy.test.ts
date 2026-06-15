import { describe, expect, it } from 'vitest';
import { describeLockInCard, describeNextUnlock } from './lockInCopy';

describe('lockInCopy', () => {
  const setupBlock = {
    days: ['mon'],
    startTime: '13:00',
    endTime: '14:00',
    notifyOnStart: true,
  } as const;

  it('mentions the next setup day on the home card', () => {
    expect(
      describeLockInCard(
        {
          kind: 'locked',
          nextUnlock: {
            at: new Date('2026-06-16T13:00:00'),
            day: 'tue',
          },
        },
        setupBlock,
        new Date('2026-06-15T10:00:00'),
      ).subtitle,
    ).toBe('Next setup window tomorrow 13:00–14:00.');
  });

  it('keeps the settings status precise about when editing returns', () => {
    expect(
      describeNextUnlock(
        {
          kind: 'locked',
          nextUnlock: {
            at: new Date('2026-06-16T13:00:00'),
            day: 'tue',
          },
        },
        setupBlock,
        new Date('2026-06-15T10:00:00'),
      ),
    ).toBe('Next unlock tomorrow 13:00 · in 1 day.');
  });
});
