import { describe, expect, it } from 'vitest';
import { focusBlockAppliesToDevice } from './deviceScope';
import type { FocusBlock } from './types';

function block(scope: FocusBlock['scope']): Pick<FocusBlock, 'scope'> {
  return { scope };
}

describe('focusBlockAppliesToDevice', () => {
  it('applies all-device blocks everywhere', () => {
    expect(
      focusBlockAppliesToDevice(block({ kind: 'allDevices' }), 'iphone'),
    ).toBe(true);
  });

  it('applies device blocks only on their owner device', () => {
    expect(
      focusBlockAppliesToDevice(
        block({ kind: 'device', deviceId: 'iphone' }),
        'iphone',
      ),
    ).toBe(true);
    expect(
      focusBlockAppliesToDevice(
        block({ kind: 'device', deviceId: 'iphone' }),
        'ipad',
      ),
    ).toBe(false);
  });
});
