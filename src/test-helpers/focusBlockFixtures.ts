import { EMPTY_BLOCK_SELECTION } from '../features/blocker/types';
import type {
  DayOfWeek,
  FocusBlockInput,
  RuntimeFocusBlock,
} from '../features/schedule/types';
import type { SetupBlock } from '../features/settings/adminState';

const WEEKDAYS: readonly DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export function savedSelection(
  webDomains: readonly string[] = [],
): RuntimeFocusBlock['selection'] {
  return {
    activitySelection: {
      status: 'saved',
      applicationCount: 1,
      categoryCount: 0,
      webDomainCount: 0,
      includeEntireCategory: true,
    },
    webDomains,
  };
}

export function runtimeBlock(
  overrides: Partial<RuntimeFocusBlock> = {},
): RuntimeFocusBlock {
  return {
    ...focusBlockInput(),
    id: 'block',
    name: 'Block',
    days: ['mon'],
    isEnabled: true,
    selection: savedSelection(),
    ...overrides,
  };
}

export function focusBlockInput(
  overrides: Partial<FocusBlockInput> = {},
): FocusBlockInput {
  return {
    name: 'Work',
    startTime: '09:00',
    endTime: '17:00',
    days: WEEKDAYS,
    rule: { kind: 'blockDuringSchedule' },
    selection: { ...EMPTY_BLOCK_SELECTION, webDomains: ['example.com'] },
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: false,
    ...overrides,
  };
}

export const SUNDAY_SETUP_BLOCK: SetupBlock = {
  days: ['sun'],
  startTime: '20:00',
  endTime: '21:00',
  notifyOnStart: false,
};
