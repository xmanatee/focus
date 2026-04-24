import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';

export default function TabLayout(): JSX.Element {
  const insets = useSafeAreaInsets();
  const initialize = useBlockerStore((state) => state.initialize);

  useEffect(() => {
    initialize().catch((caught: unknown) => {
      console.error(
        '[fucus] Failed to read Screen Time state:',
        caught instanceof Error ? caught.message : caught,
      );
    });
  }, [initialize]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: insets.bottom > 0 ? 0 : 10,
        },
        tabBarActiveTintColor: '#1E40AF',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Status' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="schedules" options={{ title: 'Schedules' }} />
    </Tabs>
  );
}
