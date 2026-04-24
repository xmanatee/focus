import { useQuery } from 'convex/react';
import { Tabs } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';
import { RequireAuth } from '../../src/features/auth/RequireAuth';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
import { useProfileStore } from '../../src/features/profile/useProfileStore';
import { useActiveSchedule } from '../../src/features/schedule/useActiveSchedule';
import { useScheduleStore } from '../../src/features/schedule/useScheduleStore';
import { Icon } from '../../src/shared/components/Icon';
import { Screen } from '../../src/shared/components/Screen';
import { Typography } from '../../src/shared/components/Typography';
import { useThemeColors } from '../../src/shared/design/theme';

type BootPhase = 'permissions' | 'profile' | 'data' | 'reconcile';

type TabsBootState =
  | { kind: 'loading'; phase: BootPhase }
  | { kind: 'ready' }
  | { kind: 'error'; phase: BootPhase; message: string };

function messageFromError(caught: unknown, fallback: string): string {
  return caught instanceof Error ? caught.message : fallback;
}

function titleForPhase(phase: BootPhase): string {
  switch (phase) {
    case 'permissions':
      return 'Checking Screen Time access.';
    case 'profile':
      return 'Preparing your blocklist.';
    case 'data':
      return 'Loading your schedules.';
    case 'reconcile':
      return 'Syncing focus rules to iPhone.';
  }
}

export default function TabLayout(): JSX.Element {
  return (
    <RequireAuth>
      <ProtectedTabLayout />
    </RequireAuth>
  );
}

function ProtectedTabLayout(): JSX.Element {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const initialize = useBlockerStore((s) => s.initialize);
  const ensureDefault = useProfileStore((s) => s.ensureDefault);
  const reconcile = useScheduleStore((s) => s.reconcile);
  const hasSyncedOnce = useRef(false);
  const [bootState, setBootState] = useState<TabsBootState>({
    kind: 'loading',
    phase: 'permissions',
  });
  const bootPhase = bootState.kind === 'ready' ? null : bootState.phase;

  const schedules = useQuery(api.schedules.get);
  const profiles = useQuery(api.profiles.list);
  const { active } = useActiveSchedule(schedules);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let phase: BootPhase = 'permissions';
      try {
        setBootState({ kind: 'loading', phase });
        await initialize();
        if (cancelled) {
          return;
        }

        phase = 'profile';
        setBootState({ kind: 'loading', phase });
        await ensureDefault();
        if (cancelled) {
          return;
        }

        if (!hasSyncedOnce.current) {
          setBootState({ kind: 'loading', phase: 'data' });
        }
      } catch (caught) {
        if (!cancelled) {
          setBootState({
            kind: 'error',
            phase,
            message: messageFromError(caught, 'Could not initialize Fucus.'),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureDefault, initialize]);

  useEffect(() => {
    if (bootState.kind === 'error') {
      return;
    }
    if (
      bootState.kind === 'loading' &&
      (bootPhase === 'permissions' || bootPhase === 'profile')
    ) {
      return;
    }
    if (!schedules || !profiles) {
      if (!hasSyncedOnce.current) {
        setBootState({ kind: 'loading', phase: 'data' });
      }
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (!hasSyncedOnce.current) {
          setBootState({ kind: 'loading', phase: 'reconcile' });
        }
        const selectionsById = Object.fromEntries(
          profiles.map((profile) => [profile._id, profile.selection]),
        );
        await reconcile(schedules, selectionsById);
        if (!cancelled && !hasSyncedOnce.current) {
          hasSyncedOnce.current = true;
          setBootState({ kind: 'ready' });
        }
      } catch (caught) {
        if (!cancelled) {
          setBootState({
            kind: 'error',
            phase: 'reconcile',
            message: messageFromError(
              caught,
              'Could not sync schedules to Screen Time.',
            ),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootPhase, bootState.kind, profiles, reconcile, schedules]);

  if (bootState.kind === 'loading') {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-3">
          <Typography variant="label" tone="muted">
            Starting up
          </Typography>
          <Typography variant="display-md" tone="ink">
            {titleForPhase(bootState.phase)}
          </Typography>
        </View>
      </Screen>
    );
  }

  if (bootState.kind === 'error') {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-4">
          <Typography variant="label" tone="danger">
            Startup failed
          </Typography>
          <Typography variant="display-md" tone="ink">
            {titleForPhase(bootState.phase)}
          </Typography>
          <Typography variant="body" tone="muted">
            {bootState.message}
          </Typography>
        </View>
      </Screen>
    );
  }

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
