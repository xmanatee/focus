import {
  AuthorizationStatus as NativeAuthorizationStatus,
  getAuthorizationStatus,
  onAuthorizationStatusChange,
  requestAuthorization,
} from 'react-native-device-activity';

export type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined';

interface IBlockerBridge {
  requestAuthorization(): Promise<boolean>;
  readAuthorizationStatus(): AuthorizationStatus;
  subscribeToAuthorizationStatus(
    listener: (status: AuthorizationStatus) => void,
  ): () => void;
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
  async requestAuthorization(): Promise<boolean> {
    await requestAuthorization('individual');
    return this.readAuthorizationStatus() === 'authorized';
  }

  readAuthorizationStatus(): AuthorizationStatus {
    return mapAuthorizationStatus(getAuthorizationStatus());
  }

  subscribeToAuthorizationStatus(
    listener: (status: AuthorizationStatus) => void,
  ): () => void {
    const subscription = onAuthorizationStatusChange((event) => {
      listener(mapAuthorizationStatus(event.authorizationStatus));
    });
    return () => subscription.remove();
  }
}

export const BlockerBridge: IBlockerBridge = new ScreenTimeBlockerBridge();
