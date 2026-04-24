import {
  AuthorizationStatus as NativeAuthorizationStatus,
  getAuthorizationStatus,
  requestAuthorization,
} from 'react-native-device-activity';

type AuthorizationStatus = 'authorized' | 'denied' | 'notDetermined';

interface IBlockerBridge {
  requestAuthorization(): Promise<boolean>;
  checkAuthorizationStatus(): Promise<AuthorizationStatus>;
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
    return (await this.checkAuthorizationStatus()) === 'authorized';
  }

  async checkAuthorizationStatus(): Promise<AuthorizationStatus> {
    return mapAuthorizationStatus(getAuthorizationStatus());
  }
}

export const BlockerBridge: IBlockerBridge = new ScreenTimeBlockerBridge();
