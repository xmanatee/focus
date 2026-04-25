import type { EmergencyMode, EmergencyQuota } from './types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function resolveEmergencyQuota(
  mode: EmergencyMode,
  now: Date,
): EmergencyQuota {
  if (mode.kind === 'disabled') return { kind: 'disabled' };

  const cutoff = now.getTime() - WEEK_MS;
  const recent = mode.history.filter((h) => h.usedAt > cutoff);

  if (recent.length >= mode.weeklyLimit) {
    const oldest = recent.reduce(
      (acc, h) => (h.usedAt < acc ? h.usedAt : acc),
      Number.POSITIVE_INFINITY,
    );
    return { kind: 'exhausted', resetsAt: new Date(oldest + WEEK_MS) };
  }

  if (mode.cooldownMinutes > 0 && recent.length > 0) {
    const last = recent.reduce(
      (acc, h) => (h.usedAt > acc ? h.usedAt : acc),
      0,
    );
    const unlocksAt = last + mode.cooldownMinutes * 60 * 1000;
    if (unlocksAt > now.getTime()) {
      return { kind: 'cooldown', unlocksAt: new Date(unlocksAt) };
    }
  }

  return {
    kind: 'ready',
    remainingThisWeek: mode.weeklyLimit - recent.length,
    codeLength: mode.codeLength,
  };
}
