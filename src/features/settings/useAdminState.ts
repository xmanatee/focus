import { useQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { type AdminState, resolveAdminState } from './adminState';

const TICK_MS = 15_000;

interface AdminStateView {
  readonly state: AdminState;
  readonly now: Date;
  readonly isSettled: boolean;
}

export function useAdminState(): AdminStateView {
  const settings = useQuery(api.settings.get);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<AdminStateView>(() => {
    if (settings === undefined) {
      return {
        state: { kind: 'unlocked', reason: 'always' },
        now,
        isSettled: false,
      };
    }
    return {
      state: resolveAdminState(settings?.setupWindow ?? null, now),
      now,
      isSettled: true,
    };
  }, [now, settings]);
}
