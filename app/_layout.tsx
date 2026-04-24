import '../global.css';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { convex } from '../src/api/convex';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';

const storage = {
  getItem: SecureStore.getItemAsync,
  setItem: SecureStore.setItemAsync,
  removeItem: SecureStore.deleteItemAsync,
};

export default function RootLayout(): JSX.Element {
  const isDark = useIsDark();
  const colors = useThemeColors();

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <ConvexAuthProvider
          client={convex}
          storage={storage}
          shouldHandleCode={false}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.surface },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
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
        </ConvexAuthProvider>
      </SafeAreaProvider>
    </View>
  );
}
