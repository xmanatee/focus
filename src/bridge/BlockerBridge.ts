import {
  AuthorizationStatus as NativeAuthorizationStatus,
  activitySelectionMetadata,
  blockSelection,
  clearWebContentFilterPolicy,
  getAuthorizationStatus,
  isShieldActive,
  isWebContentFilterPolicyActive,
  requestAuthorization,
  setWebContentFilterPolicy,
  unblockSelection,
} from 'react-native-device-activity';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../features/blocker/constants';
import {
  EMPTY_ACTIVITY_SELECTION,
  type FucusConfig,
  type PersistedActivitySelection,
  createSavedActivitySelection,
  hasSavedActivitySelection,
} from '../features/blocker/types';

type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined';

interface IBlockerBridge {
  requestAuthorization(): Promise<boolean>;
  checkAuthorizationStatus(): Promise<AuthorizationStatus>;
  getActivitySelection(): PersistedActivitySelection;
  isBlockerActive(): boolean;
  syncState(config: FucusConfig): Promise<void>;
}

function mapAuthorizationStatus(status: number): AuthorizationStatus {
  if (status === NativeAuthorizationStatus.approved) {
    return 'authorized';
  }
  if (status === NativeAuthorizationStatus.denied) {
    return 'denied';
  }
  return 'notDetermined';
}

class ScreenTimeBlockerBridge implements IBlockerBridge {
  async requestAuthorization() {
    await requestAuthorization('individual');
    return (await this.checkAuthorizationStatus()) === 'authorized';
  }

  async checkAuthorizationStatus() {
    return mapAuthorizationStatus(getAuthorizationStatus());
  }

  getActivitySelection() {
    const metadata = activitySelectionMetadata({
      activitySelectionId: BLOCK_ACTIVITY_SELECTION_ID,
    });
    if (!metadata) {
      return EMPTY_ACTIVITY_SELECTION;
    }
    return createSavedActivitySelection(metadata);
  }

  isBlockerActive() {
    return isShieldActive() || isWebContentFilterPolicyActive();
  }

  async syncState(config: FucusConfig) {
    if (!config.isActive) {
      unblockSelection(
        { activitySelectionId: BLOCK_ACTIVITY_SELECTION_ID },
        'fucus.syncState',
      );
      clearWebContentFilterPolicy('fucus.syncState');
      return;
    }

    if (hasSavedActivitySelection(config.selection.activitySelection)) {
      blockSelection(
        { activitySelectionId: BLOCK_ACTIVITY_SELECTION_ID },
        'fucus.syncState',
      );
    } else {
      unblockSelection(
        { activitySelectionId: BLOCK_ACTIVITY_SELECTION_ID },
        'fucus.syncState',
      );
    }

    if (config.selection.webDomains.length === 0) {
      clearWebContentFilterPolicy('fucus.syncState');
      return;
    }

    setWebContentFilterPolicy(
      {
        type: 'specific',
        domains: config.selection.webDomains,
      },
      'fucus.syncState',
    );
  }
}

export const BlockerBridge: IBlockerBridge = new ScreenTimeBlockerBridge();
