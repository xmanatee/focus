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

      const authorization = await BlockerBridge.requestAuthorization();
      set((state) => ({
        access: { ...state.access, authorization },
      }));
      return authorization.status === 'authorized';
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

      const status = await BlockerBridge.requestRuntimeAuthorization(kind);
      set((state) => ({
        access: {
          ...state.access,
          runtimeAccess: { ...state.access.runtimeAccess, [kind]: status },
        },
      }));
      return status === 'authorized';
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
