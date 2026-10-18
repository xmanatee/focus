import { describe, expect, it } from 'vitest';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import { focusBlockInput } from '../test-helpers/focusBlockFixtures';
import { serializeAndroidRuntimePlan } from './androidRuntimePlan';

function runtimeBlock(
  id: string,
  overrides: Partial<RuntimeFocusBlock> = {},
): RuntimeFocusBlock {
  return {
    ...focusBlockInput({
      selection: {
        activitySelection: {
          applicationCount: 1,
          categoryCount: 0,
          includeEntireCategory: false,
          status: 'saved',
          webDomainCount: 0,
        },
        webDomains: [],
      },
    }),
    id,
    isEnabled: true,
    ...overrides,
  };
}

describe('serializeAndroidRuntimePlan', () => {
  it('serializes every enforcement input and omits disabled blocks', () => {
    const payload = serializeAndroidRuntimePlan(
      [
        runtimeBlock('combined', {
          rule: { kind: 'allowDuringScheduleWithBudget', minutes: 45 },
          selection: {
            activitySelection: {
              applicationCount: 2,
              categoryCount: 0,
              includeEntireCategory: false,
              status: 'saved',
              webDomainCount: 0,
            },
            webDomains: ['youtube.com'],
          },
        }),
        runtimeBlock('off', { isEnabled: false }),
      ],
      () =>
        JSON.stringify({
          applications: [
            { id: 'com.example.video', name: 'Video' },
            { id: 'com.example.social', name: 'Social' },
          ],
        }),
    );

    expect(JSON.parse(payload)).toEqual({
      blocks: [
        {
          days: ['mon', 'tue', 'wed', 'thu', 'fri'],
          endTime: '17:00',
          id: 'combined',
          name: 'Work',
          rule: {
            kind: 'allowDuringScheduleWithBudget',
            minutes: 45,
          },
          selectedPackageIds: ['com.example.social', 'com.example.video'],
          startTime: '09:00',
          webDomains: ['youtube.com'],
        },
      ],
      version: 1,
    });
  });
});
