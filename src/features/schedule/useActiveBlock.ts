import { useEffect, useMemo, useState } from 'react';
import {
  type FocusBlockRuntimeStatus,
  getFocusBlockRuntimeStatus,
} from './runtimeStatus';
import type { FocusBlock } from './types';

interface ActiveBlockView {
  readonly active: Extract<FocusBlockRuntimeStatus, { kind: 'active' }> | null;
  readonly now: Date;
}

const TICK_MS = 15_000;

function isActiveStatus(
  status: FocusBlockRuntimeStatus,
): status is Extract<FocusBlockRuntimeStatus, { kind: 'active' }> {
  return status.kind === 'active';
}

export function useActiveBlock(
  focusBlocks: readonly FocusBlock[],
): ActiveBlockView {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<ActiveBlockView>(() => {
    const active =
      focusBlocks
        .map((block) => getFocusBlockRuntimeStatus(block, now))
        .find(isActiveStatus) ?? null;
    return { active, now };
  }, [now, focusBlocks]);
}
