import { Alert } from 'react-native';
import { create } from 'zustand';
import {
  BlockerBridge,
  type BlockingAuthorizationState,
} from '../../bridge/BlockerBridge';
import { errorMessage } from '../../shared/errors';

type BusyState = 'idle' | 'authorizing';

interface BlockerState {
  readonly authorization: BlockingAuthorizationState;
  readonly busyState: BusyState;
  readonly requestPermissions: () => Promise<boolean>;
}

function confirmAuthorizationDisclosure(
  authorization: BlockingAuthorizationState,
): Promise<boolean> {
  if (authorization.setupStep === 'restrictedSettings') {
    return Promise.resolve(true);
  }
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

export const useBlockerStore = create<BlockerState>()((set, get) => ({
  authorization: BlockerBridge.readInitialAuthorizationState(),
  busyState: 'idle',

  requestPermissions: async () => {
    set({ busyState: 'authorizing' });
    try {
      const shouldOpenSettings = await confirmAuthorizationDisclosure(
        get().authorization,
      );
      if (!shouldOpenSettings) return false;

      const authorization = await BlockerBridge.requestAuthorization();
      set({ authorization });
      return authorization.status === 'authorized';
    } catch (error) {
      Alert.alert('Could not request blocking access', errorMessage(error));
      return false;
    } finally {
      set({ busyState: 'idle' });
    }
  },
}));

BlockerBridge.subscribeToAuthorizationState((authorization) => {
  useBlockerStore.setState({ authorization });
});
