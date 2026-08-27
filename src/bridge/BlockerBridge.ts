import * as DeviceActivity from 'react-native-device-activity';
import {
  parseBlockingAuthorizationState,
  parseSelectedApplications,
  serializeSelectedApplications,
} from './BlockerBridge.shared';
import type {
  AuthorizationStatus,
  BlockingAuthorizationState,
  BlockingCapabilities,
  DeviceActivityModule,
  IBlockerBridge,
  NativeActivityEventRecord,
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
  maxScheduledMonitors: 20,
  maxWebDomains: 50,
  restrictedSettingsSetup: null,
  runtimeKind: 'deviceActivity',
  selectionTitle: 'Apps & Categories',
  supportsAppCategories: true,
  supportsDailyBudgets: true,
  supportsScheduleNotifications: true,
  supportsTamperProtection: true,
  supportsWebsiteBlocking: true,
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

  readInitialAuthorizationState(): BlockingAuthorizationState {
    return parseBlockingAuthorizationState({
      setupStep: 'authorizationSettings',
      status: mapAuthorizationStatus(
        this.deviceActivity.getAuthorizationStatus(),
      ),
    });
  }

  subscribeToAuthorizationState(
    listener: (state: BlockingAuthorizationState) => void,
  ): () => void {
    const subscription = this.deviceActivity.onAuthorizationStatusChange(
      (event) =>
        listener({
          setupStep: 'authorizationSettings',
          status: mapAuthorizationStatus(event.authorizationStatus),
        }),
    );
    return () => subscription.remove();
  }

  getActivityEvents(
    activityName: string,
  ): readonly NativeActivityEventRecord[] {
    return this.deviceActivity.getEvents(activityName);
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
