import * as DeviceActivity from 'react-native-device-activity';
import type {
  AuthorizationStatus,
  BlockerAccessState,
  BlockingCapabilities,
  IBlockerBridge,
} from './BlockerBridge.types';

export type {
  BlockingAuthorizationState,
  SelectableApplication,
} from './BlockerBridge.types';
const CAPABILITIES: BlockingCapabilities = {
  authorizationDisclosure: null,
  authorizationAccessName: 'Screen Time access',
  authorizationRequestBody:
    'Focus Blocks needs Screen Time permission before it can shield apps system-wide.',
  canReconcileWithoutAuthorization: false,
  deniedAuthorizationAction: 'appSettings',
  deniedAuthorizationDetail: 'Denied in iOS Settings',
  finishDeviceBody:
    'Rules sync with iCloud, but iOS keeps app selections private to each iPhone and iPad. Pick apps once on this device before those app blocks can apply here.',
  lockInConfigurationBody:
    'The setup window syncs through iCloud, but each device decides for itself when to enforce it.',
  maxScheduledMonitors: 20,
  restrictedSettingsSetup: null,
  runtimeAccessDisclosure: {
    dailyBudgets: null,
    websiteBlocking: null,
  },
  selectionTitle: 'Apps & Categories',
  strictModeBody:
    'Mark this as a high-stakes block and pair it with iOS tamper protection. Active blocks are read-only until they end.',
  strictModeEnableBody:
    'Strict blocks should be paired with iOS tamper protection. Please review the timing and blocked apps before you turn this on.',
  supportsAppCategories: true,
  supportsSystemTamperProtection: true,
};

function mapAuthorizationStatus(status: number): AuthorizationStatus {
  if (status === DeviceActivity.AuthorizationStatus.approved)
    return 'authorized';
  if (status === DeviceActivity.AuthorizationStatus.denied) return 'denied';
  return 'notDetermined';
}

function accessState(status: number): BlockerAccessState {
  const authorizationStatus = mapAuthorizationStatus(status);
  return {
    authorization: {
      setupStep: 'authorizationSettings',
      status: authorizationStatus,
    },
    runtimeAccess: {
      dailyBudgets: authorizationStatus,
      websiteBlocking: authorizationStatus,
    },
  };
}

class ScreenTimeBlockerBridge implements IBlockerBridge {
  readonly capabilities = CAPABILITIES;

  async requestAuthorization(): Promise<BlockerAccessState> {
    await DeviceActivity.requestAuthorization('individual');
    return accessState(await DeviceActivity.pollAuthorizationStatus());
  }

  async requestRuntimeAuthorization(): Promise<BlockerAccessState> {
    return this.requestAuthorization();
  }

  readInitialAccessState(): BlockerAccessState {
    return accessState(DeviceActivity.getAuthorizationStatus());
  }

  subscribeToAccessState(
    listener: (state: BlockerAccessState) => void,
  ): () => void {
    const subscription = DeviceActivity.onAuthorizationStatusChange((event) =>
      listener(accessState(event.authorizationStatus)),
    );
    return () => subscription.remove();
  }

  isBudgetThresholdReached(activityName: string): boolean {
    const events = DeviceActivity.getEvents(activityName);
    const threshold = events.find(
      (event) =>
        event.callbackName === 'eventDidReachThreshold' &&
        event.eventName === 'limit',
    );
    const intervalStart = events.find(
      (event) => event.callbackName === 'intervalDidStart',
    );
    return (
      threshold !== undefined &&
      intervalStart !== undefined &&
      threshold.lastCalledAt > intervalStart.lastCalledAt
    );
  }

  getSelectionSlotValue(slotId: string): string | undefined {
    return DeviceActivity.getFamilyActivitySelectionId(slotId);
  }

  setSelectionSlotValue(slotId: string, value: string | undefined): void {
    DeviceActivity.setFamilyActivitySelectionId({
      familyActivitySelection: value ?? '',
      id: slotId,
    });
  }
}

export const BlockerBridge: IBlockerBridge = new ScreenTimeBlockerBridge();
