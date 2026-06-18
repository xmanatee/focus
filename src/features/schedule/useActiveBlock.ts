import { useEffect, useMemo, useState } from 'react';
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

const TICK_MS = 15_000;

export function useActiveBlock(
  focusBlocks: readonly RuntimeFocusBlock[],
): ActiveBlockView {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<ActiveBlockView>(() => {
    const activeBlocks = getActiveBlockStatuses(focusBlocks, now);
    return { active: activeBlocks[0] ?? null, activeBlocks, now };
  }, [now, focusBlocks]);
}
