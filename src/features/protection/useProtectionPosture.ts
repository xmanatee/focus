import { useMemo } from 'react';
import { resolveProtectionPosture } from './posture';
import type { ProtectionPosture } from './types';
import { useTamperSetupStore } from './useTamperSetupStore';

export function useProtectionPosture(): ProtectionPosture {
  const setup = useTamperSetupStore((s) => s.setup);
  return useMemo(() => resolveProtectionPosture(setup), [setup]);
}
