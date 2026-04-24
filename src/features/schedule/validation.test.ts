import { describe, expect, it } from 'vitest';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../blocker/constants';
import type { BlockSelection } from '../blocker/types';
import type { CreateScheduleInput, DayOfWeek } from './types';
import { validateScheduleInput } from './validation';

const selectionWithApps: BlockSelection = {
  activitySelection: {
    status: 'saved',
    selectionId: BLOCK_ACTIVITY_SELECTION_ID,
    applicationCount: 3,
    categoryCount: 0,
    webDomainCount: 0,
    includeEntireCategory: false,
  },
  webDomains: [],
};

const selectionWithDomains: BlockSelection = {
  activitySelection: { status: 'empty' },
  webDomains: ['example.com'],
};

const emptySelection: BlockSelection = {
  activitySelection: { status: 'empty' },
  webDomains: [],
};

function baseInput(
  overrides: Partial<CreateScheduleInput> = {},
): CreateScheduleInput {
  const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
  return {
    name: 'Work',
    startTime: '09:00',
    endTime: '17:00',
    days: weekdays,
    isEnabled: true,
    selection: selectionWithApps,
    ...overrides,
  };
}

describe('validateScheduleInput', () => {
  it('accepts a valid weekday schedule with an app selection', () => {
    expect(() => validateScheduleInput(baseInput())).not.toThrow();
  });

  it('accepts a schedule whose only targets are web domains', () => {
    expect(() =>
      validateScheduleInput(baseInput({ selection: selectionWithDomains })),
    ).not.toThrow();
  });

  it('rejects an empty name', () => {
    expect(() => validateScheduleInput(baseInput({ name: '   ' }))).toThrow(
      /name is required/i,
    );
  });

  it.each([
    ['24:00', '17:00'],
    ['09:00', '9:00'],
    ['0900', '1700'],
    ['09:60', '17:00'],
  ])('rejects malformed times %s - %s', (startTime, endTime) => {
    expect(() =>
      validateScheduleInput(baseInput({ startTime, endTime })),
    ).toThrow(/HH:mm/i);
  });

  it('rejects an empty day list', () => {
    expect(() => validateScheduleInput(baseInput({ days: [] }))).toThrow(
      /at least one day/i,
    );
  });

  it('rejects duplicate days', () => {
    expect(() =>
      validateScheduleInput(baseInput({ days: ['mon', 'mon'] })),
    ).toThrow(/unique/i);
  });

  it('rejects a selection with no blocked apps or domains', () => {
    expect(() =>
      validateScheduleInput(baseInput({ selection: emptySelection })),
    ).toThrow(/at least one app or blocked website/i);
  });

  it('rejects a saved selection with an unexpected selectionId', () => {
    const input = baseInput({
      selection: {
        activitySelection: {
          status: 'saved',
          selectionId: 'some-other-id',
          applicationCount: 1,
          categoryCount: 0,
          webDomainCount: 0,
          includeEntireCategory: false,
        },
        webDomains: [],
      },
    });
    expect(() => validateScheduleInput(input)).toThrow(
      /unsupported activity selection/i,
    );
  });
});
