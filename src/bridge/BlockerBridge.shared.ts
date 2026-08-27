import { isRecord } from '../shared/validation';
import type {
  BlockingAuthorizationState,
  SelectableApplication,
} from './BlockerBridge.types';

export function parseBlockingAuthorizationState(
  value: unknown,
): BlockingAuthorizationState {
  if (!isRecord(value)) {
    throw new Error('Blocking authorization state is invalid.');
  }
  const { setupStep, status } = value;
  if (
    (setupStep !== 'authorizationSettings' &&
      setupStep !== 'restrictedSettings') ||
    (status !== 'authorized' &&
      status !== 'denied' &&
      status !== 'notDetermined')
  ) {
    throw new Error('Blocking authorization state is invalid.');
  }
  return { setupStep, status };
}

export function sortedUniqueApplications(
  applications: readonly SelectableApplication[],
): readonly SelectableApplication[] {
  const byId = new Map<string, SelectableApplication>();
  for (const app of applications) {
    if (app.id.trim().length === 0 || app.name.trim().length === 0) {
      throw new Error('Selectable application is invalid.');
    }
    byId.set(app.id, { id: app.id, name: app.name });
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function serializeSelectedApplications(
  applications: readonly SelectableApplication[],
): string {
  return JSON.stringify({
    applications: sortedUniqueApplications(applications),
  });
}

export function parseSelectedApplications(
  slotValue: string | undefined,
): readonly SelectableApplication[] {
  if (slotValue === undefined) return [];
  const parsed: unknown = JSON.parse(slotValue);
  if (!isRecord(parsed) || !Array.isArray(parsed.applications)) {
    throw new Error('Stored Android app selection is invalid.');
  }
  return sortedUniqueApplications(parsed.applications);
}
