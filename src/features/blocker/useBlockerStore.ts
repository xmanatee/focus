import { Alert } from 'react-native';
import { create } from 'zustand';
import {
  type AuthorizationStatus,
  BlockerBridge,
} from '../../bridge/BlockerBridge';
import { errorMessage } from '../../shared/errors';

type BusyState = 'idle' | 'authorizing';

interface BlockerState {
  readonly busyState: BusyState;
  readonly authorizationStatus: AuthorizationStatus;
  readonly refreshAuthorizationStatus: () => Promise<void>;
  readonly requestPermissions: () => Promise<boolean>;
}

function confirmAuthorizationDisclosure(): Promise<boolean> {
  const disclosure = BlockerBridge.capabilities.authorizationDisclosure;
  if (disclosure === null) return Promise.resolve(true);

  return new Promise((resolve) => {
    let resolved = false;
    const resolveOnce = (value: boolean): void => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };

    Alert.alert(
      disclosure.title,
      disclosure.body,
      [
        {
          text: disclosure.cancelAction,
          style: 'cancel',
          onPress: () => resolveOnce(false),
        },
        {
          text: disclosure.continueAction,
          onPress: () => resolveOnce(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolveOnce(false),
      },
    );
  });
}

export const useBlockerStore = create<BlockerState>()((set) => ({
  busyState: 'idle',
  authorizationStatus: BlockerBridge.readInitialAuthorizationStatus(),

  refreshAuthorizationStatus: async () => {
    set({
      authorizationStatus: await BlockerBridge.refreshAuthorizationStatus(),
    });
  },

  requestPermissions: async () => {
    set({ busyState: 'authorizing' });
    try {
      const shouldOpenSettings = await confirmAuthorizationDisclosure();
      if (!shouldOpenSettings) return false;

      const granted = await BlockerBridge.requestAuthorization();
      set({
        authorizationStatus: granted
          ? 'authorized'
          : await BlockerBridge.refreshAuthorizationStatus(),
      });
      return granted;
    } catch (error) {
      Alert.alert('Could not request blocking access', errorMessage(error));
      return false;
    } finally {
      set({ busyState: 'idle' });
    }
  },
}));

BlockerBridge.subscribeToAuthorizationStatus((status) => {
  useBlockerStore.setState({ authorizationStatus: status });
});
