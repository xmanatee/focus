import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
import { useBlocklistStore } from '../../src/features/blocker/useBlocklistStore';
import { reconcileSchedules } from '../../src/features/schedule/scheduler';
import { useActiveSchedule } from '../../src/features/schedule/useActiveSchedule';
import { useScheduleStore } from '../../src/features/schedule/useScheduleStore';
import { Icon } from '../../src/shared/components/Icon';
import { useThemeColors } from '../../src/shared/design/theme';

export default function TabLayout(): JSX.Element {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const initialize = useBlockerStore((s) => s.initialize);
  const schedules = useScheduleStore((s) => s.schedules);
  const selection = useBlocklistStore((s) => s.selection);
  const { active } = useActiveSchedule(schedules);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    void reconcileSchedules(
      schedules.map((schedule) => ({
        id: schedule.id,
        days: schedule.days,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isEnabled: schedule.isEnabled,
        profileSelection: selection,
      })),
    );
  }, [schedules, selection]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          height: insets.bottom > 0 ? 72 + insets.bottom : 72,
        },
        tabBarActiveTintColor: active ? colors.signal : colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
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
          title: 'Blocklist',
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
