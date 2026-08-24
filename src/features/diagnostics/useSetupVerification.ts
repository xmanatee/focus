import { useMemo } from 'react';
import { useCurrentMinute } from '../../shared/hooks/useCurrentMinute';
import { evaluateSetupVerification } from './diagnostics';
import type { SetupVerification } from './diagnostics';
import { useDiagnosticsSnapshot } from './useDiagnosticsSnapshot';

export function useSetupVerification(): SetupVerification {
  const snapshot = useDiagnosticsSnapshot();
  const now = useCurrentMinute();

  return useMemo(
    () => evaluateSetupVerification({ ...snapshot, now }),
    [snapshot, now],
  );
}
