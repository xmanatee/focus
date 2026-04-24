import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBlocklistStore } from '../src/features/blocker/useBlocklistStore';
import { useScheduleStore } from '../src/features/schedule/useScheduleStore';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';
import { attachCloudSync } from '../src/shared/storage';

export default function RootLayout(): JSX.Element {
  const isDark = useIsDark();
  const colors = useThemeColors();

  useEffect(
    () =>
      attachCloudSync(() => {
        void useBlocklistStore.persist.rehydrate();
        void useScheduleStore.persist.rehydrate();
        void useSettingsStore.persist.rehydrate();
      }),
    [],
  );

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.surface },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="add-schedule"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="select-apps"
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </View>
  );
}
