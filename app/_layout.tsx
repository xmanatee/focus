import '../global.css';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useTamperSetupStore } from '../src/features/protection/useTamperSetupStore';
import { useBlockActivationStore } from '../src/features/schedule/useBlockActivationStore';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { useTemplateStore } from '../src/features/schedule/useTemplateStore';
import { useSetupBlockDeviceStore } from '../src/features/settings/setupBlockDeviceStore';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';
import { attachCloudSync } from '../src/shared/storage';

interface PersistedStore {
  readonly persist: {
    readonly hasHydrated: () => boolean;
    readonly rehydrate: () => Promise<void> | void;
  };
}

async function rehydrateStore(
  label: string,
  store: PersistedStore,
): Promise<void> {
  await store.persist.rehydrate();
  if (!store.persist.hasHydrated()) {
    throw new Error(`${label} could not load.`);
  }
}

async function rehydrateAll(): Promise<void> {
  await rehydrateStore('Focus blocks', useFocusBlockStore);
  await rehydrateStore('Block activation', useBlockActivationStore);
  await rehydrateStore('Settings', useSettingsStore);
  await rehydrateStore('Lock-in device state', useSetupBlockDeviceStore);
  await rehydrateStore('Templates', useTemplateStore);
  await rehydrateStore('Protection setup', useTamperSetupStore);
  const focusBlocks = useFocusBlockStore.getState().focusBlocks;
  useBlockActivationStore
    .getState()
    .syncBlockPresence(focusBlocks.map((block) => block.id));
  const setupBlock = useSettingsStore.getState().setupBlock;
  useSetupBlockDeviceStore
    .getState()
    .syncSetupBlockPresence(setupBlock !== null);
  if (setupBlock !== null) {
    useFocusBlockStore.getState().clearAllStrict();
  }
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function RootLayout(): JSX.Element {
  const isDark = useIsDark();
  const colors = useThemeColors();
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const handleStorageError = (error: unknown): void => {
      if (!isCurrent) return;
      setStorageError(formatError(error));
      setIsHydrated(true);
    };
    async function hydrate(markHydrated: boolean): Promise<void> {
      try {
        await rehydrateAll();
        if (!isCurrent) return;
        setStorageError(null);
        if (markHydrated) setIsHydrated(true);
      } catch (error) {
        handleStorageError(error);
      }
    }

    void hydrate(true);
    const detachCloudSync = attachCloudSync(
      () => void hydrate(false),
      handleStorageError,
    );
    return () => {
      isCurrent = false;
      detachCloudSync();
    };
  }, []);

  useEffect(() => {
    const refreshAuthorizationStatus =
      useBlockerStore.getState().refreshAuthorizationStatus;
    refreshAuthorizationStatus();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAuthorizationStatus();
    });
    return () => subscription.remove();
  }, []);

  if (!isHydrated) {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.surface }}
        className={isDark ? 'dark' : ''}
      />
    );
  }

  if (storageError !== null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          justifyContent: 'center',
          padding: 24,
          gap: 8,
        }}
        className={isDark ? 'dark' : ''}
      >
        <Text
          style={{
            color: colors.ink,
            fontSize: 20,
            fontWeight: '700',
          }}
        >
          Focus Blocks could not load
        </Text>
        <Text style={{ color: colors.inkMuted, fontSize: 16, lineHeight: 22 }}>
          {storageError}
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-focus-block"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="diagnostics"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="finish-device"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
            }}
          />
          <Stack.Screen
            name="protection"
            options={{
              presentation: 'formSheet',
              sheetGrabberVisible: true,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </View>
  );
}
