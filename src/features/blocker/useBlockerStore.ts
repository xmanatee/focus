import { Alert } from 'react-native';
import { create } from 'zustand';
import { BlockerBridge } from '../../bridge/BlockerBridge';
import type {
  BlockerAccessState,
  BlockingAccessDisclosure,
  RuntimeAccessKind,
} from '../../bridge/BlockerBridge.types';
import { errorMessage } from '../../shared/errors';

type BusyState = 'idle' | 'authorization' | RuntimeAccessKind;

interface BlockerState {
  readonly access: BlockerAccessState;
  readonly busyState: BusyState;
  readonly requestPermissions: () => Promise<boolean>;
  readonly requestRuntimePermissions: (
    kind: RuntimeAccessKind,
  ) => Promise<boolean>;
}

function confirmAuthorizationDisclosure(
  disclosure: BlockingAccessDisclosure | null,
  skipDisclosure: boolean,
): Promise<boolean> {
  if (skipDisclosure || disclosure === null) return Promise.resolve(true);

  return new Promise((resolve) => {
    Alert.alert(
      disclosure.title,
      disclosure.body,
      [
        {
          text: disclosure.cancelAction,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: disclosure.continueAction,
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });
}

export const useBlockerStore = create<BlockerState>()((set, get) => ({
  access: BlockerBridge.readInitialAccessState(),
  busyState: 'idle',

  requestPermissions: async () => {
    set({ busyState: 'authorization' });
    try {
      const shouldOpenSettings = await confirmAuthorizationDisclosure(
        BlockerBridge.capabilities.authorizationDisclosure,
        get().access.authorization.setupStep === 'restrictedSettings',
      );
      if (!shouldOpenSettings) return false;

      const access = await BlockerBridge.requestAuthorization();
      set({ access });
      return access.authorization.status === 'authorized';
    } catch (error) {
      Alert.alert('Could not request blocking access', errorMessage(error));
      return false;
    } finally {
      set({ busyState: 'idle' });
    }
  },

  requestRuntimePermissions: async (kind) => {
    set({ busyState: kind });
    try {
      const shouldOpenSettings = await confirmAuthorizationDisclosure(
        BlockerBridge.capabilities.runtimeAccessDisclosure[kind],
        false,
      );
      if (!shouldOpenSettings) return false;

      const access = await BlockerBridge.requestRuntimeAuthorization(kind);
      set({ access });
      return access.runtimeAccess[kind] === 'authorized';
    } catch (error) {
      Alert.alert('Could not request required access', errorMessage(error));
      return false;
    } finally {
      set({ busyState: 'idle' });
    }
  },
}));

BlockerBridge.subscribeToAccessState((access) => {
  useBlockerStore.setState({ access });
});
