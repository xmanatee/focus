import { formatRelative, formatTimeRange } from '../../shared/days';
import type { AdminState, SetupBlock } from './adminState';

function calendarLabel(at: Date, now: Date): string {
  const startOf = (value: Date): Date => {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const deltaDays =
    (startOf(at).getTime() - startOf(now).getTime()) / (24 * 60 * 60 * 1000);

  if (deltaDays === 0) return 'today';
  if (deltaDays === 1) return 'tomorrow';

  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(at);
}

export function describeLockInCard(
  state: AdminState,
  setupBlock: SetupBlock | null,
  now: Date,
): {
  readonly title: string;
  readonly subtitle: string;
} {
  if (setupBlock === null) {
    return {
      title: 'Set up Lock-in',
      subtitle:
        'Set a weekly setup window so you can edit blocks only during it.',
    };
  }

  if (state.kind === 'unlocked') {
    return {
      title: 'Editable now',
      subtitle: 'You are inside your setup window — edits are allowed.',
    };
  }

  if (state.nextUnlock === null) {
    return {
      title: 'Locked',
      subtitle: 'Setup block needs to be configured.',
    };
  }

  return {
    title: 'Locked',
    subtitle: `Next setup window ${calendarLabel(
      state.nextUnlock.at,
      now,
    )} ${formatTimeRange(setupBlock.startTime, setupBlock.endTime)}.`,
  };
}

export function describeNextUnlock(
  state: AdminState,
  setupBlock: SetupBlock | null,
  now: Date,
): string {
  if (state.kind === 'unlocked') {
    return '';
  }
  if (setupBlock === null || state.nextUnlock === null) {
    return 'Setup block needs to be configured.';
  }

  return `Next unlock ${calendarLabel(state.nextUnlock.at, now)} ${
    setupBlock.startTime
  } · ${formatRelative(state.nextUnlock.at, now)}.`;
}
