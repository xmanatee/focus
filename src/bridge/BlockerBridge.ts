import { AppState, NativeModules, Platform } from 'react-native';
import * as DeviceActivity from 'react-native-device-activity';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import type {
  AndroidBlockerModule,
  AuthorizationStatus,
  BlockingCapabilities,
  DeviceActivityModule,
  IBlockerBridge,
  NativeActivityEventRecord,
  SelectableApplication,
} from './BlockerBridge.types';

export type {
  AuthorizationStatus,
  DeviceActivityAction,
  SelectableApplication,
} from './BlockerBridge.types';

const IOS_CAPABILITIES: BlockingCapabilities = {
  authorizationDisclosure: null,
  authorizationAccessName: 'Screen Time access',
  authorizationRequestBody:
    'Focus Blocks needs Screen Time permission before it can shield apps system-wide.',
  deniedAuthorizationAction: 'appSettings',
  deniedAuthorizationDetail: 'Denied in iOS Settings',
  finishDeviceBody:
    'Rules sync with iCloud, but iOS keeps app selections private to each iPhone and iPad. Pick apps once on this device before those app blocks can apply here.',
  maxWebDomains: 50,
  runtimeKind: 'deviceActivity',
  selectionTitle: 'Apps & Categories',
  supportsAppCategories: true,
  supportsDailyBudgets: true,
  supportsScheduleNotifications: true,
  supportsTamperProtection: true,
  supportsWebsiteBlocking: true,
};

const ANDROID_CAPABILITIES: BlockingCapabilities = {
  authorizationDisclosure: {
    body: 'Focus Blocks uses Android Accessibility to detect the foreground app, compare it with your enabled blocks, and bring you back to Focus Blocks when a selected app is blocked. It does not read screen content, capture keystrokes, or sell or share Accessibility data. Blocking works only while this access stays enabled.',
    cancelAction: 'Not now',
    continueAction: 'Open Settings',
    title: 'Allow Accessibility access?',
  },
  authorizationAccessName: 'Android blocking access',
  authorizationRequestBody:
    'Focus Blocks needs Accessibility access to detect blocked apps and return you to Focus Blocks when a block is active.',
  deniedAuthorizationAction: 'authorizationSettings',
  deniedAuthorizationDetail: 'Not enabled in Android Accessibility settings',
  finishDeviceBody:
    'Rules sync, but Android app selections are local to each phone or tablet. Pick apps once on this device and update any synced blocks that use iOS-only options.',
  maxWebDomains: 0,
  runtimeKind: 'androidAccessibility',
  selectionTitle: 'Apps',
  supportsAppCategories: false,
  supportsDailyBudgets: false,
  supportsScheduleNotifications: false,
  supportsTamperProtection: false,
  supportsWebsiteBlocking: false,
};

function loadDeviceActivityModule(): DeviceActivityModule {
  return DeviceActivity as DeviceActivityModule;
}

function androidModule(): AndroidBlockerModule {
  const module = NativeModules.FocusAndroidBlocker as
    | AndroidBlockerModule
    | undefined;
  if (module === undefined) {
    throw new Error('FocusAndroidBlocker native module is not linked.');
  }
  return module;
}

function mapAuthorizationStatus(status: number): AuthorizationStatus {
  const native = loadDeviceActivityModule();
  if (status === native.AuthorizationStatus.approved) return 'authorized';
  if (status === native.AuthorizationStatus.denied) return 'denied';
  return 'notDetermined';
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
  const parsed = JSON.parse(slotValue) as {
    readonly applications?: readonly SelectableApplication[];
  };
  if (!Array.isArray(parsed.applications)) {
    throw new Error('Stored Android app selection is invalid.');
  }
  return sortedUniqueApplications(parsed.applications);
}

function androidRuntimePayload(
  blocks: readonly RuntimeFocusBlock[],
  generatedAt: Date,
): string {
  return JSON.stringify({
    blocks: blocks
      .filter((block) => block.isEnabled)
      .map((block) => ({
        days: block.days,
        endTime: block.endTime,
        id: block.id,
        name: block.name,
        ruleKind: block.rule.kind,
        selectedPackageIds: parseSelectedApplications(
          BlockerBridge.getSelectionSlotValue(`block.${block.id}`),
        ).map((app) => app.id),
        startTime: block.startTime,
      })),
    generatedAt: generatedAt.toISOString(),
  });
}

class ScreenTimeBlockerBridge implements IBlockerBridge {
  readonly capabilities = IOS_CAPABILITIES;

  get deviceActivity(): DeviceActivityModule {
    return loadDeviceActivityModule();
  }

  async requestAuthorization(): Promise<boolean> {
    const native = this.deviceActivity;
    await native.requestAuthorization('individual');
    const status = await native.pollAuthorizationStatus();
    return mapAuthorizationStatus(status) === 'authorized';
  }

  readInitialAuthorizationStatus(): AuthorizationStatus {
    return mapAuthorizationStatus(this.deviceActivity.getAuthorizationStatus());
  }

  async refreshAuthorizationStatus(): Promise<AuthorizationStatus> {
    return this.readInitialAuthorizationStatus();
  }

  subscribeToAuthorizationStatus(
    listener: (status: AuthorizationStatus) => void,
  ): () => void {
    const subscription = this.deviceActivity.onAuthorizationStatusChange(
      (event) => listener(mapAuthorizationStatus(event.authorizationStatus)),
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
    return [];
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

class AndroidBlockerBridge implements IBlockerBridge {
  readonly capabilities = ANDROID_CAPABILITIES;

  get deviceActivity(): DeviceActivityModule {
    throw new Error('DeviceActivity is not available on Android.');
  }

  async requestAuthorization(): Promise<boolean> {
    return androidModule().requestAuthorization();
  }

  readInitialAuthorizationStatus(): AuthorizationStatus {
    return androidModule().initialAuthorizationStatus ?? 'notDetermined';
  }

  refreshAuthorizationStatus(): Promise<AuthorizationStatus> {
    return androidModule().refreshAuthorizationStatus();
  }

  subscribeToAuthorizationStatus(
    listener: (status: AuthorizationStatus) => void,
  ): () => void {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void this.refreshAuthorizationStatus().then(listener);
    });
    return () => subscription.remove();
  }

  getActivityEvents(): readonly NativeActivityEventRecord[] {
    return [];
  }

  getSelectionSlotValue(slotId: string): string | undefined {
    return androidModule().getSelectionSlotValue(slotId);
  }

  async listSelectableApplications(): Promise<
    readonly SelectableApplication[]
  > {
    return sortedUniqueApplications(
      await androidModule().listSelectableApplications(),
    );
  }

  async reconcileRuntimeBlocks(
    blocks: readonly RuntimeFocusBlock[],
    generatedAt: Date,
  ): Promise<void> {
    await androidModule().reconcileRuntimeBlocks(
      androidRuntimePayload(blocks, generatedAt),
    );
  }

  setSelectionSlotValue(slotId: string, value: string | undefined): void {
    androidModule().setSelectionSlotValue(slotId, value ?? '');
  }
}

function createBlockerBridge(): IBlockerBridge {
  return Platform.OS === 'android'
    ? new AndroidBlockerBridge()
    : new ScreenTimeBlockerBridge();
}

export const BlockerBridge: IBlockerBridge = createBlockerBridge();
