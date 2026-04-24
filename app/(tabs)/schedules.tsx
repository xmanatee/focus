import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useScheduleStore } from '../../src/features/schedule/useScheduleStore';
import { Button } from '../../src/shared/components/Button';
import { Typography } from '../../src/shared/components/Typography';

export default function SchedulesScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const schedules = useQuery(api.schedules.get);
  const toggleSchedule = useScheduleStore((state) => state.toggleSchedule);
  const [busyScheduleId, setBusyScheduleId] = useState<Id<'schedules'> | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = async (
    scheduleId: Id<'schedules'>,
    nextIsEnabled: boolean,
  ): Promise<void> => {
    setBusyScheduleId(scheduleId);
    setErrorMessage(null);
    try {
      await toggleSchedule(scheduleId, nextIsEnabled);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update schedule.',
      );
    } finally {
      setBusyScheduleId(null);
    }
  };

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row justify-between items-center mt-8 mb-8">
        <View>
          <Typography variant="h2">Schedules</Typography>
          <Typography variant="caption" className="mt-1">
            Automate your focus times.
          </Typography>
        </View>
        <Button
          title="Add"
          variant="secondary"
          onPress={() => router.push('/add-schedule')}
        />
      </View>

      {errorMessage ? (
        <Typography variant="caption" className="mb-4 text-red-600">
          {errorMessage}
        </Typography>
      ) : null}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {schedules === undefined ? (
          <View className="items-center mt-12">
            <Typography
              variant="body"
              align="center"
              className="text-textMuted px-4"
            >
              Loading schedules...
            </Typography>
          </View>
        ) : schedules.length === 0 ? (
          <View className="items-center mt-12">
            <Typography
              variant="body"
              align="center"
              className="text-textMuted px-4"
            >
              No schedules created yet. Create one to automatically block apps
              during specific times.
            </Typography>
          </View>
        ) : (
          schedules.map((schedule) => (
            <View
              key={schedule._id}
              className="bg-surface p-5 rounded-2xl mb-4 border border-gray-200"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Typography variant="h3">{schedule.name}</Typography>
                  <Typography variant="caption">
                    {schedule.days.join(', ')} • {schedule.startTime} -{' '}
                    {schedule.endTime}
                  </Typography>
                </View>
                <Switch
                  value={schedule.isEnabled}
                  onValueChange={() =>
                    void handleToggle(schedule._id, !schedule.isEnabled)
                  }
                  disabled={busyScheduleId === schedule._id}
                  trackColor={{ true: '#1E40AF' }}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
