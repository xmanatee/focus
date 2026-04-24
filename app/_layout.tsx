import '../global.css';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authClient } from '../src/api/authClient';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL.');
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

export default function RootLayout(): JSX.Element {
  const isDark = useIsDark();
  const colors = useThemeColors();

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
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
        </ConvexBetterAuthProvider>
      </SafeAreaProvider>
    </View>
  );
}
