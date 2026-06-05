import { useEffect, useMemo, useState } from 'react';
import { evaluateSetupVerification } from './diagnostics';
import type { SetupVerification } from './diagnostics';
import { useDiagnosticsSnapshot } from './useDiagnosticsSnapshot';

const TICK_MS = 15_000;

export function useSetupVerification(): SetupVerification {
  const snapshot = useDiagnosticsSnapshot();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo(
    () => evaluateSetupVerification({ ...snapshot, now }),
    [snapshot, now],
  );
}
