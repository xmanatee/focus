import { describe, expect, it } from 'vitest';
import {
  focusBlockInput,
  savedSelection,
} from '../../test-helpers/focusBlockFixtures';
import { assertRuntimeCapacity } from './runtimeCapacity';
import type { RuntimeFocusBlock } from './types';

function block(id: string, isEnabled = true): RuntimeFocusBlock {
  return {
    id,
    ...focusBlockInput({
      days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    }),
    isEnabled,
  };
}

describe('assertRuntimeCapacity', () => {
  it('accepts up to twenty enabled schedule days', () => {
    expect(() =>
      assertRuntimeCapacity(
        [
          block('first'),
          block('second'),
          {
            ...block('third'),
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
          },
        ],
        null,
      ),
    ).not.toThrow();
  });

  it('rejects a configuration that would exceed the native limit', () => {
    expect(() =>
      assertRuntimeCapacity(
        [block('first'), block('second'), block('third')],
        null,
      ),
    ).toThrow(/needs 21 schedule monitors.*supports 20/i);
  });

  it('counts lock-in reminders but ignores disabled blocks', () => {
    expect(() =>
      assertRuntimeCapacity(
        [block('first'), block('second'), block('off', false)],
        {
          days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          startTime: '20:00',
          endTime: '21:00',
          notifyOnStart: true,
        },
      ),
    ).toThrow(/needs 21 schedule monitors/i);
  });

  function websiteBlock(
    id: string,
    overrides: Partial<RuntimeFocusBlock> = {},
  ): RuntimeFocusBlock {
    return {
      ...block(id),
      days: ['sun'],
      selection: savedSelection(
        Array.from({ length: 30 }, (_, index) => `${id}-${index}.example`),
      ),
      ...overrides,
    };
  }

  it('rejects overlapping website blocks that exceed the system-wide limit', () => {
    expect(() =>
      assertRuntimeCapacity(
        [websiteBlock('first'), websiteBlock('second')],
        null,
      ),
    ).toThrow(/60 websites at once.*supports 50/i);
  });

  it('allows distinct website lists in consecutive windows and ignores disabled blocks', () => {
    expect(() =>
      assertRuntimeCapacity(
        [
          websiteBlock('first', { startTime: '09:00', endTime: '10:00' }),
          websiteBlock('second', { startTime: '10:00', endTime: '11:00' }),
          websiteBlock('off', { isEnabled: false }),
        ],
        null,
      ),
    ).not.toThrow();
  });

  it('counts a shared domain only once across overlapping blocks', () => {
    expect(() =>
      assertRuntimeCapacity(
        [websiteBlock('same'), { ...websiteBlock('same'), id: 'other' }],
        null,
      ),
    ).not.toThrow();
  });

  it('checks overnight overlaps across the week boundary', () => {
    expect(() =>
      assertRuntimeCapacity(
        [
          websiteBlock('overnight', { startTime: '22:00', endTime: '06:00' }),
          websiteBlock('morning', {
            days: ['mon'],
            startTime: '05:00',
            endTime: '07:00',
          }),
        ],
        null,
      ),
    ).toThrow(/60 websites at once/i);
  });

  it.each(['dailyBudget', 'allowDuringScheduleWithBudget'] as const)(
    'reserves capacity for exhausted %s rules',
    (kind) => {
      expect(() =>
        assertRuntimeCapacity(
          [
            websiteBlock('scheduled'),
            websiteBlock('budget', { rule: { kind, minutes: 10 } }),
          ],
          null,
        ),
      ).toThrow(/60 websites at once/i);
    },
  );

  it('checks restrictions outside allow-only windows, not inside them', () => {
    expect(() =>
      assertRuntimeCapacity(
        [
          websiteBlock('allow', { rule: { kind: 'allowDuringSchedule' } }),
          websiteBlock('late', { startTime: '18:00', endTime: '19:00' }),
        ],
        null,
      ),
    ).toThrow(/60 websites at once/i);
  });
});
