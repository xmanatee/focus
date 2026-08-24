import { AppState, NativeModules } from 'react-native';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import {
  parseSelectedApplications,
  sortedUniqueApplications,
} from './BlockerBridge.shared';
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
export {
  parseSelectedApplications,
  serializeSelectedApplications,
} from './BlockerBridge.shared';

const CAPABILITIES: BlockingCapabilities = {
  authorizationDisclosure: {
    body: 'Focus Blocks uses Android Accessibility to detect the foreground app, compare it with your enabled blocks, and bring you back to Focus Blocks when a selected app is blocked. It does not read screen content, capture keystrokes, or sell or share Accessibility data. Blocking works only while this access stays enabled.',
    cancelAction: 'Not now',
    continueAction: 'Open Settings',
    title: 'Allow Accessibility access?',
  },
  authorizationAccessName: 'Android blocking access',
  authorizationRequestBody:
    'Focus Blocks needs Accessibility access to detect blocked apps and return you to Focus Blocks when a block is active.',
  canReconcileWithoutAuthorization: true,
  deniedAuthorizationAction: 'authorizationSettings',
  deniedAuthorizationDetail: 'Not enabled in Android Accessibility settings',
  finishDeviceBody:
    'Rules and app selections stay on this Android device. Pick apps for each block and replace any unsupported rule before enabling it here.',
  maxScheduledMonitors: null,
  maxWebDomains: 0,
  runtimeKind: 'androidAccessibility',
  selectionTitle: 'Apps',
  supportsAppCategories: false,
  supportsDailyBudgets: false,
  supportsScheduleNotifications: false,
  supportsTamperProtection: false,
  supportsWebsiteBlocking: false,
};

function nativeModule(): AndroidBlockerModule {
  const module = NativeModules.FocusAndroidBlocker as
    | AndroidBlockerModule
    | undefined;
  if (module === undefined) {
    throw new Error('FocusAndroidBlocker native module is not linked.');
  }
  return module;
}

function parseAuthorizationStatus(value: unknown): AuthorizationStatus {
  if (
    value === 'authorized' ||
    value === 'denied' ||
    value === 'notDetermined'
  ) {
    return value;
  }
  throw new Error('Android blocking authorization status is invalid.');
}

function runtimePayload(blocks: readonly RuntimeFocusBlock[]): string {
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
  });
}

class AndroidBlockerBridge implements IBlockerBridge {
  readonly capabilities = CAPABILITIES;

  get deviceActivity(): DeviceActivityModule {
    throw new Error('DeviceActivity is not available with Android blocking.');
  }

  requestAuthorization(): Promise<boolean> {
    return nativeModule().requestAuthorization();
  }

  readInitialAuthorizationStatus(): AuthorizationStatus {
    return parseAuthorizationStatus(nativeModule().initialAuthorizationStatus);
  }

  async refreshAuthorizationStatus(): Promise<AuthorizationStatus> {
    return parseAuthorizationStatus(nativeModule().getAuthorizationStatus());
  }

  subscribeToAuthorizationStatus(
    listener: (status: AuthorizationStatus) => void,
  ): () => void {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      listener(
        parseAuthorizationStatus(nativeModule().getAuthorizationStatus()),
      );
    });
    return () => subscription.remove();
  }

  getActivityEvents(): readonly NativeActivityEventRecord[] {
    throw new Error('DeviceActivity events are not available on Android.');
  }

  getSelectionSlotValue(slotId: string): string | undefined {
    return nativeModule().getSelectionSlotValue(slotId);
  }

  async listSelectableApplications(): Promise<
    readonly SelectableApplication[]
  > {
    return sortedUniqueApplications(
      await nativeModule().listSelectableApplications(),
    );
  }

  async reconcileRuntimeBlocks(
    blocks: readonly RuntimeFocusBlock[],
  ): Promise<void> {
    await nativeModule().reconcileRuntimeBlocks(runtimePayload(blocks));
  }

  setSelectionSlotValue(slotId: string, value: string | undefined): void {
    nativeModule().setSelectionSlotValue(slotId, value ?? '');
  }
}

export const BlockerBridge: IBlockerBridge = new AndroidBlockerBridge();
