import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
import { Icon } from '../../src/shared/components/Icon';
import { color } from '../../src/shared/design/theme';

export default function TabLayout(): JSX.Element {
  const insets = useSafeAreaInsets();
  const initialize = useBlockerStore((state) => state.initialize);
  const isActive = useBlockerStore((state) => state.isActive);

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
        tabBarStyle: isActive
          ? { display: 'none' }
          : {
              backgroundColor: color.surface,
              borderTopWidth: 1,
              borderTopColor: color.divider,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
              height: insets.bottom > 0 ? 72 + insets.bottom : 72,
            },
        tabBarActiveTintColor: color.signal,
        tabBarInactiveTintColor: color.inkMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Focus',
          tabBarIcon: ({ focused, size }) => (
            <Icon
              name="timer"
              size={size}
              tone={focused ? 'signal' : 'muted'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused, size }) => (
            <Icon
              name="square.stack.3d.up.fill"
              size={size}
              tone={focused ? 'signal' : 'muted'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="schedules"
        options={{
          title: 'Schedules',
          tabBarIcon: ({ focused, size }) => (
            <Icon
              name="calendar"
              size={size}
              tone={focused ? 'signal' : 'muted'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
