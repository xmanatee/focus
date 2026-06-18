import '../global.css';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useTamperSetupStore } from '../src/features/protection/useTamperSetupStore';
import { useBlockActivationStore } from '../src/features/schedule/useBlockActivationStore';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { useSetupBlockDeviceStore } from '../src/features/settings/setupBlockDeviceStore';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';
import { attachCloudSync } from '../src/shared/storage';

async function rehydrateAll(): Promise<void> {
  await useFocusBlockStore.persist.rehydrate();
  await useBlockActivationStore.persist.rehydrate();
  await useSettingsStore.persist.rehydrate();
  await useSetupBlockDeviceStore.persist.rehydrate();
  await useTamperSetupStore.persist.rehydrate();
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

export default function RootLayout(): JSX.Element {
  const isDark = useIsDark();
  const colors = useThemeColors();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    void rehydrateAll().then(() => setIsHydrated(true));
    return attachCloudSync(() => {
      void rehydrateAll();
    });
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
