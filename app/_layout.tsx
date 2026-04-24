import '../global.css';
import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
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

  return (
    <View className={`flex-1 ${isDark ? 'dark' : ''}`}>
      <SafeAreaProvider>
        <ConvexAuthProvider
          client={convex}
          storage={storage}
          shouldHandleCode={false}
        >
          <AuthGate />
        </ConvexAuthProvider>
      </SafeAreaProvider>
    </View>
  );
}

function AuthGate(): JSX.Element {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const colors = useThemeColors();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const isPublicRoute = segments[0] === 'login';

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, router, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="small" color={colors.signal} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="add-schedule" options={{ presentation: 'modal' }} />
      <Stack.Screen name="select-apps" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
