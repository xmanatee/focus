import { isRecord } from '../shared/validation';
import type {
  AuthorizationStatus,
  BlockerAccessState,
  BlockingAuthorizationState,
  SelectableApplication,
} from './BlockerBridge.types';

function parseAuthorizationStatus(value: unknown): AuthorizationStatus {
  if (
    value !== 'authorized' &&
    value !== 'denied' &&
    value !== 'notDetermined'
  ) {
    throw new Error('Blocking access state is invalid.');
  }
  return value;
}

export function parseBlockerAccessState(value: unknown): BlockerAccessState {
  if (!isRecord(value) || !isRecord(value.runtimeAccess)) {
    throw new Error('Blocking access state is invalid.');
  }
  return {
    authorization: parseBlockingAuthorizationState(value.authorization),
    runtimeAccess: {
      dailyBudgets: parseAuthorizationStatus(value.runtimeAccess.dailyBudgets),
      websiteBlocking: parseAuthorizationStatus(
        value.runtimeAccess.websiteBlocking,
      ),
    },
  };
}

function parseBlockingAuthorizationState(
  value: unknown,
): BlockingAuthorizationState {
  if (!isRecord(value)) {
    throw new Error('Blocking authorization state is invalid.');
  }
  const { setupStep } = value;
  if (
    setupStep !== 'authorizationSettings' &&
    setupStep !== 'restrictedSettings'
  ) {
    throw new Error('Blocking authorization state is invalid.');
  }
  return { setupStep, status: parseAuthorizationStatus(value.status) };
}

function sortedUniqueApplications(
  applications: readonly SelectableApplication[],
): readonly SelectableApplication[] {
  const byId = new Map(applications.map((app) => [app.id, app]));
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

export function parseSelectableApplications(
  value: unknown,
): readonly SelectableApplication[] {
  if (!Array.isArray(value)) {
    throw new Error('Android application list is invalid.');
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
      throw new Error('Android application list is invalid.');
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
  return parseSelectableApplications(parsed.applications);
}
