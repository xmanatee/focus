import { useEffect, useMemo, useState } from 'react';
import { isFocusBlockActiveAt } from './activeness';
import type { FocusBlock } from './types';

interface ActiveBlockView {
  readonly active: FocusBlock | null;
  readonly now: Date;
}

const TICK_MS = 15_000;

export function useActiveBlock(
  focusBlocks: readonly FocusBlock[],
): ActiveBlockView {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<ActiveBlockView>(
    () => ({
      active: focusBlocks.find((b) => isFocusBlockActiveAt(b, now)) ?? null,
      now,
    }),
    [now, focusBlocks],
  );
}
