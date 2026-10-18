import { AppState } from 'react-native';
import { androidBlockerNativeModule } from './AndroidBlockerNative';
import {
  parseBlockerAccessState,
  parseNativeSelectionSlotValue,
} from './BlockerBridge.shared';
import type {
  BlockerAccessState,
  BlockingCapabilities,
  IBlockerBridge,
  RuntimeAccessKind,
} from './BlockerBridge.types';

export type {
  BlockingAuthorizationState,
  SelectableApplication,
} from './BlockerBridge.types';
const CAPABILITIES: BlockingCapabilities = {
  authorizationDisclosure: {
    body: 'Focus Blocks uses Android Accessibility to detect the foreground app, compare it with your enabled blocks, and bring you back to Focus Blocks when a selected app is blocked. It does not read screen content, capture keystrokes, or sell or share Accessibility data. Blocking works only while this access stays enabled.',
    cancelAction: 'Not now',
    continueAction: 'Open Accessibility',
    title: 'Allow Accessibility access?',
  },
  authorizationAccessName: 'Android blocking access',
  authorizationRequestBody:
    'Focus Blocks needs Accessibility access to detect blocked apps and return you to Focus Blocks when a block is active.',
  canReconcileWithoutAuthorization: true,
  deniedAuthorizationAction: 'authorizationSettings',
  deniedAuthorizationDetail: 'Accessibility access is off',
  finishDeviceBody:
    'Rules stay available on this device, while Android app selections are local. Pick apps once for each block before enabling it here.',
  lockInConfigurationBody:
    'The setup window is stored locally, and this device decides whether to enforce it.',
  maxScheduledMonitors: null,
  restrictedSettingsSetup: {
    action: 'Open app info',
    body: 'Android restricts Accessibility for apps installed outside an app store. In App info, tap the three-dot menu, choose Allow restricted settings if shown, confirm, then return to Focus Blocks.',
    title: 'Allow APK access',
  },
  runtimeAccessDisclosure: {
    dailyBudgets: {
      body: 'Focus Blocks uses Android Usage Access only to measure time spent in the apps selected for a daily budget. Usage data stays on this device and is never sold or shared.',
      cancelAction: 'Not now',
      continueAction: 'Open Usage Access',
      title: 'Allow usage measurement?',
    },
    websiteBlocking: {
      body: 'Focus Blocks creates an on-device local VPN that checks domain names against your active website blocks. Website rules stay on this device. Android allows only one VPN at a time, so enabling this replaces another active VPN. Apps that bypass Android DNS may not be filtered.',
      cancelAction: 'Not now',
      continueAction: 'Allow local VPN',
      title: 'Allow website blocking?',
    },
  },
  selectionTitle: 'Apps',
  strictModeBody:
    'Active strict blocks cannot be edited or disabled inside Focus Blocks until they end. Android can still revoke Accessibility access or uninstall the app from system settings.',
  strictModeEnableBody:
    'Review the timing and blocked apps carefully. While this block is active, its in-app controls stay locked until it ends. This does not prevent Android settings from disabling access or uninstalling Focus Blocks.',
  supportsAppCategories: false,
  supportsSystemTamperProtection: false,
};

class AndroidBlockerBridge implements IBlockerBridge {
  readonly capabilities = CAPABILITIES;

  async requestAuthorization(): Promise<BlockerAccessState> {
    return parseBlockerAccessState(
      await androidBlockerNativeModule().requestAuthorization(),
    );
  }

  async requestRuntimeAuthorization(
    kind: RuntimeAccessKind,
  ): Promise<BlockerAccessState> {
    return parseBlockerAccessState(
      await androidBlockerNativeModule().requestRuntimeAuthorization(kind),
    );
  }

  readInitialAccessState(): BlockerAccessState {
    return parseBlockerAccessState(
      androidBlockerNativeModule().initialAccessState,
    );
  }

  subscribeToAccessState(
    listener: (state: BlockerAccessState) => void,
  ): () => void {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      listener(
        parseBlockerAccessState(androidBlockerNativeModule().getAccessState()),
      );
    });
    return () => subscription.remove();
  }

  isBudgetThresholdReached(activityName: string): boolean {
    return androidBlockerNativeModule().isBudgetThresholdReached(activityName);
  }

  getSelectionSlotValue(slotId: string): string | undefined {
    return parseNativeSelectionSlotValue(
      androidBlockerNativeModule().getSelectionSlotValue(slotId),
    );
  }

  setSelectionSlotValue(slotId: string, value: string | undefined): void {
    androidBlockerNativeModule().setSelectionSlotValue(slotId, value ?? '');
  }
}

export const BlockerBridge: IBlockerBridge = new AndroidBlockerBridge();
