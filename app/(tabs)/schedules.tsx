import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { isScheduleActiveAt } from '../../src/features/schedule/activeness';
import { useActiveSchedule } from '../../src/features/schedule/useActiveSchedule';
import { useScheduleStore } from '../../src/features/schedule/useScheduleStore';
import { Icon } from '../../src/shared/components/Icon';
import { Screen } from '../../src/shared/components/Screen';
import { Typography } from '../../src/shared/components/Typography';
import { haptic } from '../../src/shared/design/haptics';
import { useThemeColors } from '../../src/shared/design/theme';
import { useAsyncAction } from '../../src/shared/hooks/useAsyncAction';

export default function SchedulesScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const schedules = useQuery(api.schedules.get);
  const toggleSchedule = useScheduleStore((s) => s.toggleSchedule);
  const { error, run } = useAsyncAction();
  const { now } = useActiveSchedule(schedules);

  const handleToggle = (
    scheduleId: Id<'schedules'>,
    nextIsEnabled: boolean,
  ): Promise<boolean> => {
    void haptic.select();
    return run(
      () => toggleSchedule(scheduleId, nextIsEnabled),
      'Could not update schedule.',
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
            void haptic.select();
            router.push('/add-schedule');
          }}
          className="h-11 w-11 items-center justify-center rounded-full bg-signal"
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

      {schedules === undefined ? (
        <Typography
          variant="body"
          tone="muted"
          className="mt-12"
          align="center"
        >
          Loading...
        </Typography>
      ) : schedules.length === 0 ? (
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
            return (
              <View
                key={schedule._id}
                className={`py-5 ${
                  index !== schedules.length - 1
                    ? 'border-b border-divider'
                    : ''
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-4">
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
                  </View>
                  <Switch
                    value={schedule.isEnabled}
                    onValueChange={(next) =>
                      void handleToggle(schedule._id, next)
                    }
                    disabled={isActive}
                    trackColor={{ true: colors.signal, false: colors.divider }}
                    thumbColor={colors.ink}
                    ios_backgroundColor={colors.divider}
                  />
                </View>
                {isActive ? (
                  <Typography variant="caption" tone="faint" className="mt-2">
                    Locked while in session. Ends at {schedule.endTime}.
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
