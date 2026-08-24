import { vi } from 'vitest';

interface ConfiguredAction {
  readonly activityName: string;
  readonly callbackName: string;
  readonly actions: readonly {
    readonly type: string;
    readonly [key: string]: unknown;
  }[];
}

interface MonitoringCall {
  readonly activityName: string;
  readonly schedule: unknown;
  readonly events: readonly unknown[];
}

interface EventRecord {
  readonly activityName: string;
  readonly callbackName: string;
  readonly eventName?: string;
  readonly lastCalledAt: number;
}

const deviceActivityState = vi.hoisted(() => ({
  authorizationStatus: 0,
  slotStore: new Map<string, string>(),
  configuredActions: [] as ConfiguredAction[],
  monitoringCalls: [] as MonitoringCall[],
  manualActions: [] as { readonly type: string; readonly payload: unknown }[],
  eventRecords: [] as EventRecord[],
  activities: new Set<string>(),
  stoppedActivities: [] as string[][],
  cleanedActivities: [] as string[],
  monitoringStartGates: [] as Promise<void>[],
}));

export const {
  slotStore,
  configuredActions,
  monitoringCalls,
  manualActions,
  eventRecords,
  activities,
  stoppedActivities,
  cleanedActivities,
} = deviceActivityState;

export function deferNextMonitoringStart(): () => void {
  let release = (): void => undefined;
  deviceActivityState.monitoringStartGates.push(
    new Promise<void>((resolve) => {
      release = resolve;
    }),
  );
  return release;
}

export function resetDeviceActivityMock(): void {
  slotStore.clear();
  configuredActions.length = 0;
  monitoringCalls.length = 0;
  manualActions.length = 0;
  eventRecords.length = 0;
  activities.clear();
  stoppedActivities.length = 0;
  cleanedActivities.length = 0;
  deviceActivityState.monitoringStartGates.length = 0;
  deviceActivityState.authorizationStatus = 0;
}

vi.mock('react-native-device-activity', () => ({
  AuthorizationStatus: {
    approved: 1,
    denied: 2,
  },
  getAuthorizationStatus: () => deviceActivityState.authorizationStatus,
  onAuthorizationStatusChange: () => ({ remove: vi.fn() }),
  pollAuthorizationStatus: async () => deviceActivityState.authorizationStatus,
  requestAuthorization: async () => {
    deviceActivityState.authorizationStatus = 1;
  },
  configureActions: (config: ConfiguredAction) => {
    deviceActivityState.configuredActions.push(config);
  },
  getActivities: () => [...deviceActivityState.activities],
  getEvents: (activityName: string) =>
    deviceActivityState.eventRecords.filter(
      (event) => event.activityName === activityName,
    ),
  resetBlocks: (triggeredBy?: string) => {
    deviceActivityState.manualActions.push({
      type: 'resetBlocks',
      payload: triggeredBy,
    });
  },
  clearWebContentFilterPolicy: (triggeredBy?: string) => {
    deviceActivityState.manualActions.push({
      type: 'clearWebContentFilterPolicy',
      payload: triggeredBy,
    });
  },
  blockSelection: (payload: unknown, triggeredBy?: string) => {
    deviceActivityState.manualActions.push({
      type: 'blockSelection',
      payload: { payload, triggeredBy },
    });
  },
  setWebContentFilterPolicy: (payload: unknown, triggeredBy?: string) => {
    deviceActivityState.manualActions.push({
      type: 'setWebContentFilterPolicy',
      payload: { payload, triggeredBy },
    });
  },
  startMonitoring: async (
    activityName: string,
    schedule: unknown,
    events: readonly unknown[],
  ) => {
    await deviceActivityState.monitoringStartGates.shift();
    deviceActivityState.activities.add(activityName);
    deviceActivityState.monitoringCalls.push({
      activityName,
      schedule,
      events,
    });
  },
  stopMonitoring: (activityNames?: string[]) => {
    const names = activityNames ?? [...deviceActivityState.activities];
    deviceActivityState.stoppedActivities.push(names);
    for (const name of names) deviceActivityState.activities.delete(name);
  },
  cleanUpAfterActivity: (activityName: string) => {
    deviceActivityState.cleanedActivities.push(activityName);
  },
  setFamilyActivitySelectionId: ({
    id,
    familyActivitySelection,
  }: {
    id: string;
    familyActivitySelection: string;
  }) => {
    if (familyActivitySelection === '') {
      deviceActivityState.slotStore.delete(id);
      return;
    }
    deviceActivityState.slotStore.set(id, familyActivitySelection);
  },
  getFamilyActivitySelectionId: (id: string) =>
    deviceActivityState.slotStore.get(id),
}));
