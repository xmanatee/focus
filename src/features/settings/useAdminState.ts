import { useMemo } from 'react';
import { useCurrentMinute } from '../../shared/hooks/useCurrentMinute';
import { type AdminState, resolveAdminState } from './adminState';
import { useSetupBlockDeviceStore } from './setupBlockDeviceStore';
import { useSettingsStore } from './useSettingsStore';

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
  const now = useCurrentMinute();

  return useMemo<AdminStateView>(
    () => ({
      isEnabledOnDevice,
      state: resolveAdminState(setupBlock, isEnabledOnDevice, now),
      now,
    }),
    [isEnabledOnDevice, now, setupBlock],
  );
}
