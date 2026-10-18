import { describe, expect, it } from 'vitest';
import {
  parseBlockerAccessState,
  parseNativeSelectionSlotValue,
  parseSelectableApplications,
  parseSelectedApplications,
} from './BlockerBridge.shared';

describe('Android blocker native boundary', () => {
  it('validates independent blocking, budget, and website access', () => {
    expect(
      parseBlockerAccessState({
        authorization: {
          setupStep: 'authorizationSettings',
          status: 'authorized',
        },
        runtimeAccess: {
          dailyBudgets: 'denied',
          websiteBlocking: 'notDetermined',
        },
      }),
    ).toEqual({
      authorization: {
        setupStep: 'authorizationSettings',
        status: 'authorized',
      },
      runtimeAccess: {
        dailyBudgets: 'denied',
        websiteBlocking: 'notDetermined',
      },
    });
  });

  it.each([
    null,
    {},
    {
      authorization: {
        setupStep: 'authorizationSettings',
        status: 'authorized',
      },
      runtimeAccess: { dailyBudgets: 'granted', websiteBlocking: 'denied' },
    },
  ])('rejects an invalid access-state payload: %j', (value) => {
    expect(() => parseBlockerAccessState(value)).toThrow(
      'Blocking access state is invalid.',
    );
  });

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
      parseSelectableApplications([
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
    expect(() => parseSelectableApplications(value)).toThrow(
      'Android application list is invalid.',
    );
  });

  it.each([
    null,
    { id: 'com.example.app', name: 7 },
    { id: ' com.example.app', name: 'App' },
    { id: 'com.example.app', name: '' },
  ])('rejects malformed stored applications: %j', (application) => {
    expect(() =>
      parseSelectedApplications(
        JSON.stringify({ applications: [application] }),
      ),
    ).toThrow('Android application list is invalid.');
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
