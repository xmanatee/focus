import { useEffect, useMemo, useState } from 'react';

interface SessionCountdown {
  readonly secondsRemaining: number;
  readonly progress: number;
}

export function useSessionCountdown(
  sessionStartedAt: number | null,
  sessionDurationSec: number,
): SessionCountdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (sessionStartedAt === null) {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [sessionStartedAt]);

  return useMemo(() => {
    if (sessionStartedAt === null) {
      return { secondsRemaining: sessionDurationSec, progress: 0 };
    }
    const elapsed = (now - sessionStartedAt) / 1000;
    const remaining = Math.max(0, sessionDurationSec - elapsed);
    const progress = Math.min(1, elapsed / sessionDurationSec);
    return { secondsRemaining: Math.ceil(remaining), progress };
  }, [now, sessionDurationSec, sessionStartedAt]);
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;
}
