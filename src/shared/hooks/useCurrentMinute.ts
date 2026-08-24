import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MINUTE_MS = 60_000;
const TIMER_TOLERANCE_MS = 50;

export function millisecondsUntilNextMinute(nowMillis: number): number {
  return MINUTE_MS - (nowMillis % MINUTE_MS) + TIMER_TOLERANCE_MS;
}

export function useCurrentMinute(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const refresh = (): void => {
      setNow(new Date());
      if (timeout !== null) clearTimeout(timeout);
      timeout = setTimeout(refresh, millisecondsUntilNextMinute(Date.now()));
    };

    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      if (timeout !== null) clearTimeout(timeout);
      subscription.remove();
    };
  }, []);

  return now;
}
