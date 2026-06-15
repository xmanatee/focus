import { useEffect, useMemo, useState } from 'react';
import { type AdminState, resolveAdminState } from './adminState';
import { useSetupBlockDeviceStore } from './setupBlockDeviceStore';
import { useSettingsStore } from './useSettingsStore';

const TICK_MS = 15_000;

interface AdminStateView {
  readonly isEnabledOnDevice: boolean;
  readonly state: AdminState;
  readonly now: Date;
}

export function useAdminState(): AdminStateView {
  const setupBlock = useSettingsStore((s) => s.setupBlock);
  const isEnabledOnDevice = useSetupBlockDeviceStore(
    (s) => s.isEnabledOnDevice,
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<AdminStateView>(
    () => ({
      isEnabledOnDevice,
      state: resolveAdminState(setupBlock, isEnabledOnDevice, now),
      now,
    }),
    [isEnabledOnDevice, now, setupBlock],
  );
}
