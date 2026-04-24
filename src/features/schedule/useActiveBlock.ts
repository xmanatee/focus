import { useEffect, useMemo, useState } from 'react';
import { isFocusBlockActiveAt, nextStartAfter } from './activeness';
import type { FocusBlock } from './types';

interface ActiveBlockView {
  readonly active: FocusBlock | null;
  readonly next: { readonly block: FocusBlock; readonly at: Date } | null;
  readonly now: Date;
}

const TICK_MS = 15_000;

export function useActiveBlock(
  focusBlocks: readonly FocusBlock[] | undefined,
): ActiveBlockView {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<ActiveBlockView>(() => {
    if (!focusBlocks || focusBlocks.length === 0) {
      return { active: null, next: null, now };
    }

    const active =
      focusBlocks.find((b) => b && isFocusBlockActiveAt(b, now)) ?? null;

    let soonest: { block: FocusBlock; at: Date } | null = null;
    for (const block of focusBlocks) {
      if (!block) continue;
      const candidate = nextStartAfter(block, now);
      if (!candidate) {
        continue;
      }
      if (soonest === null || candidate.at < soonest.at) {
        soonest = { block, at: candidate.at };
      }
    }

    return { active, next: soonest, now };
  }, [now, focusBlocks]);
}
