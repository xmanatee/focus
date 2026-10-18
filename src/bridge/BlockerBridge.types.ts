export type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined';
export type RuntimeAccessKind = 'dailyBudgets' | 'websiteBlocking';
export type RuntimeAccessState = Readonly<
  Record<RuntimeAccessKind, AuthorizationStatus>
>;
export type AuthorizationSetupStep =
  | 'authorizationSettings'
  | 'restrictedSettings';
export interface BlockingAuthorizationState {
  readonly setupStep: AuthorizationSetupStep;
  readonly status: AuthorizationStatus;
}

export interface BlockerAccessState {
  readonly authorization: BlockingAuthorizationState;
  readonly runtimeAccess: RuntimeAccessState;
}

export interface SelectableApplication {
  readonly id: string;
  readonly name: string;
}

export interface BlockingAccessDisclosure {
  readonly body: string;
  readonly cancelAction: string;
  readonly continueAction: string;
  readonly title: string;
}

export interface BlockingAccessSetupCopy {
  readonly action: string;
  readonly body: string;
  readonly title: string;
}

export interface BlockingCapabilities {
  readonly authorizationDisclosure: BlockingAccessDisclosure | null;
  readonly authorizationAccessName: string;
  readonly authorizationRequestBody: string;
  readonly canReconcileWithoutAuthorization: boolean;
  readonly deniedAuthorizationDetail: string;
  readonly deniedAuthorizationAction: 'appSettings' | 'authorizationSettings';
  readonly finishDeviceBody: string;
  readonly lockInConfigurationBody: string;
  readonly maxScheduledMonitors: number | null;
  readonly maxSimultaneousWebDomains: number | null;
  readonly selectionTitle: string;
  readonly strictModeBody: string;
  readonly strictModeEnableBody: string;
  readonly supportsAppCategories: boolean;
  readonly supportsSystemTamperProtection: boolean;
  readonly restrictedSettingsSetup: BlockingAccessSetupCopy | null;
  readonly runtimeAccessDisclosure: Readonly<
    Record<RuntimeAccessKind, BlockingAccessDisclosure | null>
  >;
}

export interface AndroidBlockerModule {
  readonly initialAccessState: unknown;
  readonly scheduleNotificationChannelId: string;
  readonly getAccessState: () => unknown;
  readonly isBudgetThresholdReached: (activityName: string) => boolean;
  readonly getSelectionSlotValue: (slotId: string) => unknown;
  readonly listSelectableApplications: () => Promise<unknown>;
  readonly reconcileRuntimeBlocks: (payload: string) => Promise<void>;
  readonly requestAuthorization: () => Promise<unknown>;
  readonly requestRuntimeAuthorization: (
    kind: RuntimeAccessKind,
  ) => Promise<unknown>;
  readonly setSelectionSlotValue: (slotId: string, value: string) => boolean;
}

export interface IBlockerBridge {
  readonly capabilities: BlockingCapabilities;
  requestAuthorization(): Promise<BlockerAccessState>;
  requestRuntimeAuthorization(
    kind: RuntimeAccessKind,
  ): Promise<BlockerAccessState>;
  readInitialAccessState(): BlockerAccessState;
  subscribeToAccessState(
    listener: (state: BlockerAccessState) => void,
  ): () => void;
  isBudgetThresholdReached(activityName: string): boolean;
  getSelectionSlotValue(slotId: string): string | undefined;
  setSelectionSlotValue(slotId: string, value: string | undefined): void;
}
