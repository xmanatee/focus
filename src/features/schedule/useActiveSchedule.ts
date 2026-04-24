import { useEffect, useMemo, useState } from 'react';
import { isScheduleActiveAt, nextStartAfter } from './activeness';
import type { Schedule } from './types';

interface ActiveScheduleView {
  readonly active: Schedule | null;
  readonly next: { readonly schedule: Schedule; readonly at: Date } | null;
  readonly now: Date;
}

const TICK_MS = 15_000;

export function useActiveSchedule(
  schedules: readonly Schedule[] | undefined,
): ActiveScheduleView {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo<ActiveScheduleView>(() => {
    if (!schedules || schedules.length === 0) {
      return { active: null, next: null, now };
    }

    const active =
      schedules.find((s) => s && isScheduleActiveAt(s, now)) ?? null;

    let soonest: { schedule: Schedule; at: Date } | null = null;
    for (const schedule of schedules) {
      if (!schedule) continue;
      const candidate = nextStartAfter(schedule, now);
      if (!candidate) {
        continue;
      }
      if (soonest === null || candidate.at < soonest.at) {
        soonest = { schedule, at: candidate.at };
      }
    }

    return { active, next: soonest, now };
  }, [now, schedules]);
}
