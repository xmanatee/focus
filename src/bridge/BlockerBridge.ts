import * as DeviceActivity from 'react-native-device-activity';
import {
  parseBlockingAuthorizationState,
  parseSelectedApplications,
  serializeSelectedApplications,
} from './BlockerBridge.shared';
import type {
  AuthorizationStatus,
  BlockerAccessState,
  BlockingAuthorizationState,
  BlockingCapabilities,
  DeviceActivityModule,
  IBlockerBridge,
  NativeActivityEventRecord,
  RuntimeAccessKind,
  SelectableApplication,
} from './BlockerBridge.types';

export type {
  BlockingAuthorizationState,
  DeviceActivityAction,
  SelectableApplication,
} from './BlockerBridge.types';
export { parseSelectedApplications, serializeSelectedApplications };

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

function loadDeviceActivityModule(): DeviceActivityModule {
  return DeviceActivity as DeviceActivityModule;
}

function mapAuthorizationStatus(status: number): AuthorizationStatus {
  const native = loadDeviceActivityModule();
  if (status === native.AuthorizationStatus.approved) return 'authorized';
  if (status === native.AuthorizationStatus.denied) return 'denied';
  return 'notDetermined';
}

class ScreenTimeBlockerBridge implements IBlockerBridge {
  readonly capabilities = CAPABILITIES;

  get deviceActivity(): DeviceActivityModule {
    return loadDeviceActivityModule();
  }

  async requestAuthorization(): Promise<BlockingAuthorizationState> {
    const native = this.deviceActivity;
    await native.requestAuthorization('individual');
    const status = await native.pollAuthorizationStatus();
    return {
      setupStep: 'authorizationSettings',
      status: mapAuthorizationStatus(status),
    };
  }

  async requestRuntimeAuthorization(): Promise<AuthorizationStatus> {
    return (await this.requestAuthorization()).status;
  }

  readInitialAccessState(): BlockerAccessState {
    const authorization = parseBlockingAuthorizationState({
      setupStep: 'authorizationSettings',
      status: mapAuthorizationStatus(
        this.deviceActivity.getAuthorizationStatus(),
      ),
    });
    return {
      authorization,
      runtimeAccess: {
        dailyBudgets: authorization.status,
        websiteBlocking: authorization.status,
      },
    };
  }

  subscribeToAccessState(
    listener: (state: BlockerAccessState) => void,
  ): () => void {
    const subscription = this.deviceActivity.onAuthorizationStatusChange(
      (event) => {
        const authorization: BlockingAuthorizationState = {
          setupStep: 'authorizationSettings',
          status: mapAuthorizationStatus(event.authorizationStatus),
        };
        listener({
          authorization,
          runtimeAccess: {
            dailyBudgets: authorization.status,
            websiteBlocking: authorization.status,
          },
        });
      },
    );
    return () => subscription.remove();
  }

  isBudgetThresholdReached(activityName: string): boolean {
    const events = this.deviceActivity.getEvents(activityName);
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
    return this.deviceActivity.getFamilyActivitySelectionId(slotId);
  }

  async listSelectableApplications(): Promise<
    readonly SelectableApplication[]
  > {
    throw new Error('Android application listing cannot run on iOS.');
  }

  async reconcileRuntimeBlocks(): Promise<void> {
    throw new Error('Android runtime reconciliation cannot run on iOS.');
  }

  setSelectionSlotValue(slotId: string, value: string | undefined): void {
    this.deviceActivity.setFamilyActivitySelectionId({
      familyActivitySelection: value ?? '',
      id: slotId,
    });
  }
}

export const BlockerBridge: IBlockerBridge = new ScreenTimeBlockerBridge();
