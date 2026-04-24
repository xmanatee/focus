import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { isScheduleActiveAt } from '../../src/features/schedule/activeness';
import { useActiveSchedule } from '../../src/features/schedule/useActiveSchedule';
import { useScheduleStore } from '../../src/features/schedule/useScheduleStore';
import { useAdminState } from '../../src/features/settings/useAdminState';
import { Icon } from '../../src/shared/components/Icon';
import { Screen } from '../../src/shared/components/Screen';
import { Typography } from '../../src/shared/components/Typography';
import { haptic } from '../../src/shared/design/haptics';
import { useThemeColors } from '../../src/shared/design/theme';
import { useAsyncAction } from '../../src/shared/hooks/useAsyncAction';

export default function SchedulesScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const schedules = useScheduleStore((s) => s.schedules);
  const toggleSchedule = useScheduleStore((s) => s.toggleSchedule);
  const deleteSchedule = useScheduleStore((s) => s.deleteSchedule);
  const { error, run } = useAsyncAction();
  const { now } = useActiveSchedule(schedules);
  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';

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
    Alert.alert(
      `Delete "${name}"?`,
      'This schedule will stop triggering. You can always create a new one.',
      [
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
      ],
    );
  };

  return (
    <Screen>
      <View className="flex-row items-start justify-between pt-4 pb-6">
        <View>
          <Typography variant="label" tone="muted">
            Schedules
          </Typography>
          <Typography variant="display-md" tone="ink">
            Set a window.
          </Typography>
        </View>
        <Pressable
          onPress={() => {
            if (isAdminLocked) return;
            void haptic.select();
            router.push('/add-schedule');
          }}
          disabled={isAdminLocked}
          className={`h-11 w-11 items-center justify-center rounded-full bg-signal ${
            isAdminLocked ? 'opacity-40' : ''
          }`}
          accessibilityLabel="Add schedule"
        >
          <Icon name="plus" size={20} tone="surface" />
        </Pressable>
      </View>

      {error ? (
        <Typography variant="caption" tone="danger" className="mb-4">
          {error}
        </Typography>
      ) : null}

      {schedules.length === 0 ? (
        <View className="mt-12 items-center gap-3">
          <Typography variant="body" tone="muted" align="center">
            No schedules yet.
          </Typography>
          <Typography variant="caption" tone="faint" align="center">
            Recurring blocks trigger automatically.
          </Typography>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {schedules.map((schedule, index) => {
            const isActive = isScheduleActiveAt(schedule, now);
            const isRowLocked = isActive || isAdminLocked;
            return (
              <View
                key={schedule.id}
                className={`py-5 ${
                  index !== schedules.length - 1
                    ? 'border-b border-divider'
                    : ''
                }`}
              >
                <View className="flex-row items-center justify-between">
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
                    className="flex-1 pr-4"
                    accessibilityLabel={`Edit ${schedule.name}`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Typography variant="body-md" tone="ink">
                        {schedule.name}
                      </Typography>
                      {isActive ? (
                        <View className="rounded-full bg-signal px-2 py-[2px]">
                          <Typography variant="caption" tone="surface">
                            Active
                          </Typography>
                        </View>
                      ) : null}
                    </View>
                    <Typography variant="caption" tone="muted" className="mt-1">
                      {schedule.days.join(' · ').toUpperCase()}{' '}
                      {schedule.startTime}–{schedule.endTime}
                    </Typography>
                  </Pressable>
                  <View className="flex-row items-center gap-3">
                    <Switch
                      value={schedule.isEnabled}
                      onValueChange={(next) =>
                        void handleToggle(schedule.id, next)
                      }
                      disabled={isRowLocked}
                      trackColor={{
                        true: colors.signal,
                        false: colors.divider,
                      }}
                      thumbColor={colors.ink}
                      ios_backgroundColor={colors.divider}
                    />
                    <Pressable
                      onPress={() => confirmDelete(schedule.id, schedule.name)}
                      disabled={isRowLocked}
                      hitSlop={10}
                      accessibilityLabel={`Delete ${schedule.name}`}
                    >
                      <Icon
                        name="trash"
                        size={20}
                        tone={isRowLocked ? 'faint' : 'muted'}
                      />
                    </Pressable>
                  </View>
                </View>
                {isActive ? (
                  <Typography variant="caption" tone="faint" className="mt-2">
                    Locked while in session. Ends at {schedule.endTime}.
                  </Typography>
                ) : isAdminLocked ? (
                  <Typography variant="caption" tone="faint" className="mt-2">
                    Locked outside setup hours.
                  </Typography>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}
    </Screen>
  );
}
