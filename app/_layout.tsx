import '../global.css';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useBlocklistStore } from '../src/features/blocker/useBlocklistStore';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';
import { attachCloudSync } from '../src/shared/storage';

export default function RootLayout(): JSX.Element {
  const isDark = useIsDark();
  const colors = useThemeColors();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    void (async () => {
      // 1. Initial rehydration (sequential to avoid storage races)
      await useBlocklistStore.persist.rehydrate();
      await useFocusBlockStore.persist.rehydrate();
      await useSettingsStore.persist.rehydrate();
      await useBlockerStore.persist.rehydrate();
      setIsHydrated(true);
    })();

    // 2. Listen for remote iCloud changes
    const cleanup = attachCloudSync(() => {
      void (async () => {
        await useBlocklistStore.persist.rehydrate();
        await useFocusBlockStore.persist.rehydrate();
        await useSettingsStore.persist.rehydrate();
        await useBlockerStore.persist.rehydrate();
      })();
    });

    return cleanup;
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
        </Stack>
      </SafeAreaProvider>
    </View>
  );
}
