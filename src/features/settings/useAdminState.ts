import { useEffect, useMemo, useState } from 'react';
import { type AdminState, resolveAdminState } from './adminState';
import { useSettingsStore } from './useSettingsStore';

const TICK_MS = 15_000;

interface AdminStateView {
  readonly state: AdminState;
  readonly now: Date;
  readonly isSettled: boolean;
export function useAdminState(): AdminStateView {
  const setupBlock = useSettingsStore((s) => s.setupBlock);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<AdminStateView>(
    () => ({
      state: resolveAdminState(setupBlock, now),
      now,
      isSettled: true,
    }),
    [now, setupBlock],
  );
}

