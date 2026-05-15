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

const deviceActivityState = vi.hoisted(() => ({
  slotStore: new Map<string, string>(),
  configuredActions: [] as ConfiguredAction[],
  monitoringCalls: [] as MonitoringCall[],
  activities: new Set<string>(),
  stoppedActivities: [] as string[][],
  cleanedActivities: [] as string[],
}));

export const {
  slotStore,
  configuredActions,
  monitoringCalls,
  activities,
  stoppedActivities,
  cleanedActivities,
} = deviceActivityState;

export function resetDeviceActivityMock(): void {
  slotStore.clear();
  configuredActions.length = 0;
  monitoringCalls.length = 0;
  activities.clear();
  stoppedActivities.length = 0;
  cleanedActivities.length = 0;
}

vi.mock('react-native-device-activity', () => ({
  configureActions: (config: ConfiguredAction) => {
    deviceActivityState.configuredActions.push(config);
  },
  getActivities: () => [...deviceActivityState.activities],
  startMonitoring: (
    activityName: string,
    schedule: unknown,
    events: readonly unknown[],
  ) => {
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
