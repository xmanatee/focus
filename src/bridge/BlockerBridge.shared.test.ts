import { describe, expect, it } from 'vitest';
import {
  parseNativeSelectableApplications,
  parseNativeSelectionSlotValue,
} from './BlockerBridge.shared';

describe('Android blocker native boundary', () => {
  it('maps a missing native selection slot to the domain absence value', () => {
    expect(parseNativeSelectionSlotValue(null)).toBeUndefined();
  });

  it('preserves a stored native selection slot', () => {
    expect(parseNativeSelectionSlotValue('{"applications":[]}')).toBe(
      '{"applications":[]}',
    );
  });

  it('validates, deduplicates, and sorts selectable applications', () => {
    expect(
      parseNativeSelectableApplications([
        { id: 'com.example.zeta', name: 'Zeta' },
        { id: 'com.example.alpha', name: 'Alpha' },
        { id: 'com.example.zeta', name: 'Zeta' },
      ]),
    ).toEqual([
      { id: 'com.example.alpha', name: 'Alpha' },
      { id: 'com.example.zeta', name: 'Zeta' },
    ]);
  });

  it.each([
    undefined,
    {},
    [null],
    [{ id: '', name: 'Empty package' }],
    [{ id: 'com.example.app', name: 7 }],
  ])('rejects an invalid selectable-application payload: %j', (value) => {
    expect(() => parseNativeSelectableApplications(value)).toThrow(
      'Native Android application list is invalid.',
    );
  });

  it.each([undefined, 7, {}])(
    'rejects an invalid native selection slot: %j',
    (value) => {
      expect(() => parseNativeSelectionSlotValue(value)).toThrow(
        'Native Android selection slot is invalid.',
      );
    },
  );
});
