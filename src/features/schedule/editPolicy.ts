import { formatRelative } from '../../shared/days';
import type { AdminState } from '../settings/adminState';
import { isFocusBlockActiveAt } from './activeness';
import type { FocusBlock } from './types';

interface EditPolicy {
  readonly readOnly: boolean;
  readonly message: string | null;
}

export function resolveEditPolicy(
  adminState: AdminState,
  existing: FocusBlock | null,
  now: Date,
): EditPolicy {
  if (adminState.kind === 'locked') {
    const next = adminState.nextUnlock;
    return {
      readOnly: true,
      message: next
        ? `Lock-in active. Editable next ${formatRelative(next.at, now)}.`
        : 'Lock-in is active.',
    };
  }
  if (existing && isFocusBlockActiveAt(existing, now)) {
    return {
      readOnly: true,
      message: `This block is active. Editable when it ends at ${existing.endTime}.`,
    };
  }
  return { readOnly: false, message: null };
}
