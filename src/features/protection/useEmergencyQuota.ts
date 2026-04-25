import { useMemo } from 'react';
import { resolveEmergencyQuota } from './quota';
import type { EmergencyQuota } from './types';
import { useEmergencyStore } from './useEmergencyStore';

export function useEmergencyQuota(now: Date): EmergencyQuota {
  const mode = useEmergencyStore((s) => s.mode);
  return useMemo(() => resolveEmergencyQuota(mode, now), [mode, now]);
}
