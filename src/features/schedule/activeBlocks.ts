import {
  type FocusBlockRuntimeStatus,
  getFocusBlockRuntimeStatus,
} from './runtimeStatus';
import type { RuntimeFocusBlock } from './types';

export type ActiveFocusBlockStatus = Extract<
  FocusBlockRuntimeStatus,
  { kind: 'active' }
>;

function isActiveStatus(
  status: FocusBlockRuntimeStatus,
): status is ActiveFocusBlockStatus {
  return status.kind === 'active';
}

export function getActiveBlockStatuses(
  focusBlocks: readonly RuntimeFocusBlock[],
  at: Date,
): readonly ActiveFocusBlockStatus[] {
  return focusBlocks
    .map((block) => getFocusBlockRuntimeStatus(block, at))
    .filter(isActiveStatus);
}
