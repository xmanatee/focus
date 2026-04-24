import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import {
  EMPTY_BLOCK_SELECTION,
  selectionHasBlockedTargets,
} from '../src/features/blocker/types';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { isScheduleActiveAt } from '../src/features/schedule/activeness';
import { reconcileSchedules } from '../src/features/schedule/scheduler';
import { useActiveSchedule } from '../src/features/schedule/useActiveSchedule';
import { useScheduleStore } from '../src/features/schedule/useScheduleStore';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { Button } from '../src/shared/components/Button';
import { Icon } from '../src/shared/components/Icon';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { formatDayShort, formatRelative } from '../src/shared/days';
import { haptic } from '../src/shared/design/haptics';
import { useThemeColors } from '../src/shared/design/theme';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

export default function MainFeedScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const initialize = useBlockerStore((s) => s.initialize);
  const authorizationStatus = useBlockerStore((s) => s.authorizationStatus);
  const busyState = useBlockerStore((s) => s.busyState);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);
  const hasPermissions = authorizationStatus === 'authorized';

  const schedules = useScheduleStore((s) => s.schedules);
  const toggleSchedule = useScheduleStore((s) => s.toggleSchedule);
  const deleteSchedule = useScheduleStore((s) => s.deleteSchedule);
  const { active, now } = useActiveSchedule(schedules);

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const setupWindow = useSettingsStore((s) => s.setupWindow);

  const { run } = useAsyncAction();

  useEffect(() => {
    void (async () => {
      try {
        await initialize();
      } catch {
        // Silently fail auth check on launch to avoid crash
      }
    })();
  }, [initialize]);

  useEffect(() => {
    void (async () => {
      try {
        await reconcileSchedules(
          schedules.map((s) => ({
            id: s.id,
            days: s.days,
            startTime: s.startTime,
            endTime: s.endTime,
            isEnabled: s.isEnabled,
            profileSelection: s.selection ?? EMPTY_BLOCK_SELECTION,
          })),
        );
      } catch {
        // Prevent background sync from crashing the app
      }
    })();
  }, [schedules]);

  const handleGrant = (): Promise<boolean> =>
    run(async () => {
      void haptic.commit();
      const granted = await requestPermissions();
      if (!granted) {
        throw new Error('Screen Time permission was not granted.');
      }
    }, 'Could not request Screen Time permission.');

  const handleToggle = (
    scheduleId: string,
    nextIsEnabled: boolean,
  ): Promise<boolean> => {
    void haptic.select();
    return run(async () => {
      toggleSchedule(scheduleId, nextIsEnabled);
    }, 'Could not update schedule.');
  };

  const confirmDelete = (scheduleId: string, name: string): void => {
    Alert.alert(`Delete "${name}"?`, 'This schedule will stop triggering.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void haptic.abandon();
          void run(async () => {
            deleteSchedule(scheduleId);
          }, 'Could not delete schedule.');
        },
      },
    ]);
  };

  if (authorizationStatus === 'denied') {
    return (
      <Screen>
        <View className="flex-row justify-between items-center py-3 mb-2">
          <Typography variant="label" tone="signal">
            Fucus
          </Typography>
        </View>
        <View className="flex-1 justify-center gap-5">
          <Typography variant="label" tone="danger">
            Permission denied
          </Typography>
          <Typography variant="display-md" tone="ink">
            Open iOS Settings.
          </Typography>
          <Typography variant="body" tone="muted" className="max-w-[340px]">
            Go to Settings → Screen Time → Family Controls and allow Fucus. iOS
            won&apos;t show the prompt again from inside the app.
          </Typography>
          <View className="mt-4">
            <Button
              title="Open Settings"
              variant="commit"
              onPress={() => {
                void haptic.select();
                void Linking.openSettings();
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row justify-between items-center py-3 mb-2">
        <Typography variant="label" tone="signal">
          Fucus
        </Typography>
        <Pressable
          onPress={() => {
            void haptic.select();
            router.push('/settings');
          }}
          className="h-11 w-11 items-center justify-center rounded-full bg-surface-raised"
          accessibilityLabel="Settings"
        >
          <Icon name="gearshape" size={20} tone="muted" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Prompt Card */}
        {!hasPermissions && (
          <View className="bg-signal/10 rounded-[32px] p-6 gap-4 border border-signal/20">
            <View className="flex-row items-center gap-3">
              <Icon name="lock.shield.fill" size={24} tone="signal" />
              <Typography variant="h3" tone="signal">
                Grant Access
              </Typography>
            </View>
            <Typography variant="body" tone="ink">
              Fucus needs Screen Time permissions to block distracting apps.
            </Typography>
            <Button
              title="Give access"
              variant="commit"
              onPress={() => void handleGrant()}
              isLoading={busyState === 'authorizing'}
              disabled={busyState !== 'idle'}
            />
          </View>
        )}

        {/* Active Session Card */}
        {active && (
          <View className="bg-ink rounded-[32px] p-7 gap-3 shadow-xl">
            <Typography variant="label" tone="surface" className="opacity-50">
              In session
            </Typography>
            <Typography variant="display-md" tone="surface">
              {active.name}
            </Typography>
            <Typography variant="body" tone="surface" className="opacity-50">
              Ends at {active.endTime} ·{' '}
              {formatRelative(
                (() => {
                  const end = new Date(now);
                  const [h, m] = active.endTime.split(':').map(Number);
                  end.setHours(h ?? 0, m ?? 0, 0, 0);
                  if (end <= now) end.setDate(end.getDate() + 1);
                  return end;
                })(),
                now,
              )}
            </Typography>
          </View>
        )}

        {/* Lock-in (Setup Hours) Section */}
        <View className="gap-4">
          <Typography variant="label" tone="faint" className="px-2">
            Lock-in
          </Typography>
          <Pressable
            onPress={() => router.push('/settings')}
            className="bg-surface-raised rounded-[32px] p-6 gap-3"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Icon
                  name={setupWindow ? 'lock.fill' : 'lock.open.fill'}
                  size={20}
                  tone={isAdminLocked ? 'signal' : 'muted'}
                />
                <Typography variant="h3" tone="ink">
                  {setupWindow ? 'Locked Down' : 'Stay Focused'}
                </Typography>
              </View>
              <Icon name="chevron.right" size={16} tone="faint" />
            </View>
            <Typography variant="body" tone="muted">
              {setupWindow
                ? `Changes only allowed during ${setupWindow.startTime}–${setupWindow.endTime}.`
                : 'Set a weekly setup window to lock your schedules and prevent yourself from disabling Fucus.'}
            </Typography>
          </Pressable>
        </View>

        {/* Schedules Section */}
        <View className="gap-6">
          <View className="flex-row items-center justify-between px-2">
            <Typography variant="h2" tone="ink">
              Schedules
            </Typography>
            <Pressable
              onPress={() => {
                if (isAdminLocked) return;
                void haptic.select();
                router.push('/add-schedule');
              }}
              disabled={isAdminLocked}
              className={`h-10 w-10 items-center justify-center rounded-full bg-signal ${
                isAdminLocked ? 'opacity-40' : ''
              }`}
            >
              <Icon name="plus" size={20} tone="surface" />
            </Pressable>
          </View>

          {schedules.length === 0 ? (
            <View className="bg-surface-raised/50 rounded-[32px] py-12 items-center gap-4 border border-divider/30 border-dashed">
              <Typography variant="body" tone="muted" align="center">
                Your focus calendar is empty.
              </Typography>
              <Button
                title="Add a window"
                variant="commit"
                onPress={() => router.push('/add-schedule')}
                disabled={isAdminLocked}
              />
            </View>
          ) : (
            <View className="gap-4">
              {schedules.map((schedule) => {
                const isActive = isScheduleActiveAt(schedule, now);
                const isRowLocked = isActive || isAdminLocked;
                const selection = schedule.selection ?? EMPTY_BLOCK_SELECTION;
                return (
                  <View
                    key={schedule.id}
                    className="bg-surface-raised rounded-[32px] p-6 gap-4"
                  >
                    <View className="flex-row justify-between items-start">
                      <Pressable
                        onPress={() => {
                          if (isRowLocked) return;
                          void haptic.select();
                          router.push({
                            pathname: '/add-schedule',
                            params: { id: schedule.id },
                          });
                        }}
                        disabled={isRowLocked}
                        className="flex-1"
                      >
                        <View className="flex-row items-center gap-2">
                          <Typography variant="h3" tone="ink">
                            {schedule.name}
                          </Typography>
                          {isActive && (
                            <View className="bg-signal/20 px-2 py-0.5 rounded-md">
                              <Typography variant="caption" tone="signal">
                                Active
                              </Typography>
                            </View>
                          )}
                        </View>
                        <Typography
                          variant="caption"
                          tone="muted"
                          className="mt-1"
                        >
                          {schedule.days.join(' · ').toUpperCase()} ·{' '}
                          {schedule.startTime}–{schedule.endTime}
                        </Typography>
                        <View className="flex-row items-center gap-3 mt-3">
                          <View className="bg-surface-sunken px-3 py-1.5 rounded-full flex-row items-center gap-2">
                            <Icon name="app.badge" size={12} tone="muted" />
                            <Typography variant="caption" tone="muted">
                              {selection.activitySelection.status === 'saved'
                                ? `${selection.activitySelection.applicationCount} apps`
                                : '0 apps'}
                            </Typography>
                          </View>
                          {selection.webDomains.length > 0 && (
                            <View className="bg-surface-sunken px-3 py-1.5 rounded-full flex-row items-center gap-2">
                              <Icon name="globe" size={12} tone="muted" />
                              <Typography variant="caption" tone="muted">
                                {selection.webDomains.length} sites
                              </Typography>
                            </View>
                          )}
                        </View>
                      </Pressable>
                      <View className="flex-row items-center gap-3">
                        <Switch
                          value={schedule.isEnabled}
                          onValueChange={(nextValue) =>
                            void handleToggle(schedule.id, nextValue)
                          }
                          disabled={isRowLocked}
                          trackColor={{
                            true: colors.signal,
                            false: colors.divider,
                          }}
                        />
                        <Pressable
                          onPress={() =>
                            confirmDelete(schedule.id, schedule.name)
                          }
                          disabled={isRowLocked}
                          hitSlop={10}
                        >
                          <Icon
                            name="trash"
                            size={18}
                            tone={isRowLocked ? 'faint' : 'muted'}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
