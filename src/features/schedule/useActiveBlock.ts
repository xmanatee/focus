import { useMemo } from 'react';
import { useCurrentMinute } from '../../shared/hooks/useCurrentMinute';
import {
  type ActiveFocusBlockStatus,
  getActiveBlockStatuses,
} from './activeBlocks';
import type { RuntimeFocusBlock } from './types';

interface ActiveBlockView {
  readonly active: ActiveFocusBlockStatus | null;
  readonly activeBlocks: readonly ActiveFocusBlockStatus[];
  readonly now: Date;
}

export function useActiveBlock(
  focusBlocks: readonly RuntimeFocusBlock[],
): ActiveBlockView {
  const now = useCurrentMinute();

  return useMemo<ActiveBlockView>(() => {
    const activeBlocks = getActiveBlockStatuses(focusBlocks, now);
    return { active: activeBlocks[0] ?? null, activeBlocks, now };
  }, [now, focusBlocks]);
}
