import { useSyncExternalStore } from 'react';

export type RuntimeLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface RuntimeLogEntry {
  id: number;
  level: RuntimeLogLevel;
  message: string;
}

const MAX_LOG_ENTRIES = 40;

let nextLogEntryId = 1;
let entries: RuntimeLogEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function formatLogArg(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return String(value);
  }

  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function record(level: RuntimeLogLevel, args: unknown[]) {
  const message = args.map(formatLogArg).join(' ');
  entries = [
    ...entries.slice(-(MAX_LOG_ENTRIES - 1)),
    {
      id: nextLogEntryId++,
      level,
      message,
    },
  ];
  notifyListeners();
}

export function recordRuntimeLog(level: RuntimeLogLevel, ...args: unknown[]) {
  record(level, args);
}

export const convexLogger = {
  logVerbose: (...args: unknown[]) => record('debug', args),
  log: (...args: unknown[]) => record('info', args),
  warn: (...args: unknown[]) => record('warn', args),
  error: (...args: unknown[]) => record('error', args),
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return entries;
}

export function useRuntimeLogs() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
