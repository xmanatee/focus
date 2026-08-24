import type {
  Action,
  CallbackName,
  DeviceActivityEvent,
  DeviceActivitySchedule,
  EventParsed,
} from 'react-native-device-activity';
import type { RuntimeFocusBlock } from '../features/schedule/types';

export type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined';
export type DeviceActivityAction = Action;

interface NativeEventSubscription {
  remove(): void;
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

export interface BlockingCapabilities {
  readonly authorizationDisclosure: BlockingAccessDisclosure | null;
  readonly authorizationAccessName: string;
  readonly authorizationRequestBody: string;
  readonly canReconcileWithoutAuthorization: boolean;
  readonly deniedAuthorizationDetail: string;
  readonly deniedAuthorizationAction: 'appSettings' | 'authorizationSettings';
  readonly finishDeviceBody: string;
  readonly maxScheduledMonitors: number | null;
  readonly selectionTitle: string;
  readonly runtimeKind: 'deviceActivity' | 'androidAccessibility';
  readonly supportsAppCategories: boolean;
  readonly supportsDailyBudgets: boolean;
  readonly supportsScheduleNotifications: boolean;
  readonly supportsTamperProtection: boolean;
  readonly supportsWebsiteBlocking: boolean;
  readonly maxWebDomains: number;
}

export type NativeActivityEventRecord = Pick<
  EventParsed,
  'callbackName' | 'eventName' | 'lastCalledAt'
>;

export interface DeviceActivityModule {
  readonly AuthorizationStatus: {
    readonly approved: number;
    readonly denied: number;
  };
  readonly blockSelection: (
    payload: { readonly activitySelectionId: string },
    triggeredBy?: string,
  ) => void;
  readonly cleanUpAfterActivity: (activityName: string) => void;
  readonly clearWebContentFilterPolicy: (triggeredBy?: string) => void;
  readonly configureActions: (config: {
    readonly activityName: string;
    readonly callbackName: CallbackName;
    readonly eventName?: string;
    readonly actions: Action[];
  }) => void;
  readonly getActivities: () => string[];
  readonly getAuthorizationStatus: () => number;
  readonly getEvents: (activityName: string) => NativeActivityEventRecord[];
  readonly getFamilyActivitySelectionId: (id: string) => string | undefined;
  readonly onAuthorizationStatusChange: (
    listener: (event: {
      readonly authorizationStatus: number;
    }) => void,
  ) => NativeEventSubscription;
  readonly pollAuthorizationStatus: () => Promise<number>;
  readonly requestAuthorization: (scope: 'individual') => Promise<void>;
  readonly resetBlocks: (triggeredBy?: string) => void;
  readonly setFamilyActivitySelectionId: (payload: {
    readonly id: string;
    readonly familyActivitySelection: string;
  }) => void;
  readonly setWebContentFilterPolicy: (
    payload: { readonly type: 'specific'; readonly domains: string[] },
    triggeredBy?: string,
  ) => void;
  readonly startMonitoring: (
    activityName: string,
    schedule: DeviceActivitySchedule,
    events: DeviceActivityEvent[],
  ) => Promise<void>;
  readonly stopMonitoring: (activityNames?: string[]) => void;
}

export interface AndroidBlockerModule {
  readonly initialAuthorizationStatus: AuthorizationStatus;
  readonly getAuthorizationStatus: () => AuthorizationStatus;
  readonly getSelectionSlotValue: (slotId: string) => string | undefined;
  readonly listSelectableApplications: () => Promise<SelectableApplication[]>;
  readonly reconcileRuntimeBlocks: (payload: string) => Promise<void>;
  readonly requestAuthorization: () => Promise<boolean>;
  readonly setSelectionSlotValue: (slotId: string, value: string) => boolean;
}

export interface IBlockerBridge {
  readonly capabilities: BlockingCapabilities;
  readonly deviceActivity: DeviceActivityModule;
  requestAuthorization(): Promise<boolean>;
  readInitialAuthorizationStatus(): AuthorizationStatus;
  refreshAuthorizationStatus(): Promise<AuthorizationStatus>;
  subscribeToAuthorizationStatus(
    listener: (status: AuthorizationStatus) => void,
  ): () => void;
  getActivityEvents(activityName: string): readonly NativeActivityEventRecord[];
  getSelectionSlotValue(slotId: string): string | undefined;
  listSelectableApplications(): Promise<readonly SelectableApplication[]>;
  reconcileRuntimeBlocks(blocks: readonly RuntimeFocusBlock[]): Promise<void>;
  setSelectionSlotValue(slotId: string, value: string | undefined): void;
}
