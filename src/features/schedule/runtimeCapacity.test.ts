import { describe, expect, it } from 'vitest';
import { focusBlockInput } from '../../test-helpers/focusBlockFixtures';
import { assertRuntimeMonitorCapacity } from './runtimeCapacity';
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

describe('assertRuntimeMonitorCapacity', () => {
  it('accepts up to twenty enabled schedule days', () => {
    expect(() =>
      assertRuntimeMonitorCapacity(
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
      assertRuntimeMonitorCapacity(
        [block('first'), block('second'), block('third')],
        null,
      ),
    ).toThrow(/needs 21 schedule monitors.*supports 20/i);
  });

  it('counts lock-in reminders but ignores disabled blocks', () => {
    expect(() =>
      assertRuntimeMonitorCapacity(
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
});
