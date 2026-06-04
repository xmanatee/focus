import { formatRelative } from '../../shared/days';
import type { AdminState } from '../settings/adminState';
import { getFocusBlockRuntimeStatus } from './runtimeStatus';
import type { FocusBlock } from './types';

interface EditPolicy {
  readonly readOnly: boolean;
  readonly title: string | null;
  readonly message: string | null;
}

export function resolveEditPolicy(
  adminState: AdminState,
  existing: FocusBlock | null,
  now: Date,
): EditPolicy {
  if (adminState.kind === 'locked') {
    if (existing === null) {
      return {
        readOnly: false,
        title: 'Lock-in is active',
        message:
          'You can add new blocks, but they cannot be edited or removed until your next setup window.',
      };
    }
    const next = adminState.nextUnlock;
    return {
      readOnly: true,
      title: 'Read-only',
      message: next
        ? `Lock-in active. Editable next ${formatRelative(next.at, now)}.`
        : 'Lock-in is active.',
    };
  }
  const status =
    existing === null
      ? { kind: 'inactive' as const }
      : getFocusBlockRuntimeStatus(existing, now);
  if (status.kind === 'active') {
    return {
      readOnly: true,
      title: 'Read-only',
      message: `This block is active. Editable ${formatRelative(
        status.endsAt,
        now,
      )}.`,
    };
  }
  return { readOnly: false, title: null, message: null };
}
