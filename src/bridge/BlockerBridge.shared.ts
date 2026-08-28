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

function sortedUniqueApplications(
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

export function parseNativeSelectionSlotValue(
  value: unknown,
): string | undefined {
  if (value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error('Native Android selection slot is invalid.');
  }
  return value;
}

export function parseNativeSelectableApplications(
  value: unknown,
): readonly SelectableApplication[] {
  if (!Array.isArray(value)) {
    throw new Error('Native Android application list is invalid.');
  }
  const applications = value.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      item.id.length === 0 ||
      item.id !== item.id.trim() ||
      typeof item.name !== 'string' ||
      item.name.length === 0 ||
      item.name !== item.name.trim()
    ) {
      throw new Error('Native Android application list is invalid.');
    }
    return { id: item.id, name: item.name };
  });
  return sortedUniqueApplications(applications);
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
