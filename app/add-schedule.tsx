import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import type {
  CreateScheduleInput,
  DayOfWeek,
} from '../src/features/schedule/types';
import { useScheduleStore } from '../src/features/schedule/useScheduleStore';
import { validateScheduleInput } from '../src/features/schedule/validation';
import { Button } from '../src/shared/components/Button';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

const DAYS: readonly { label: string; value: DayOfWeek; order: number }[] = [
  { label: 'Mon', value: 'mon', order: 0 },
  { label: 'Tue', value: 'tue', order: 1 },
  { label: 'Wed', value: 'wed', order: 2 },
  { label: 'Thu', value: 'thu', order: 3 },
  { label: 'Fri', value: 'fri', order: 4 },
  { label: 'Sat', value: 'sat', order: 5 },
  { label: 'Sun', value: 'sun', order: 6 },
] as const;

const ORDER: Record<DayOfWeek, number> = DAYS.reduce(
  (acc, day) => {
    acc[day.value] = day.order;
    return acc;
  },
  {} as Record<DayOfWeek, number>,
);

function timeStringToDate(value: string): Date {
  const [hours, minutes] = value.split(':').map((part) => Number(part));
  const date = new Date();
  date.setHours(hours ?? 9, minutes ?? 0, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export default function AddScheduleScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const addSchedule = useScheduleStore((s) => s.addSchedule);
  const selection = useBlockerStore((s) => s.selection);

  const [name, setName] = useState('Focus window');
  const [startDate, setStartDate] = useState(() => timeStringToDate('09:00'));
  const [endDate, setEndDate] = useState(() => timeStringToDate('17:00'));
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
  ]);

  const { error, isPending, run } = useAsyncAction();

  const startTime = useMemo(() => dateToTimeString(startDate), [startDate]);
  const endTime = useMemo(() => dateToTimeString(endDate), [endDate]);

  const toggleDay = (day: DayOfWeek): void => {
    void haptic.select();
    setSelectedDays((current) => {
      if (current.includes(day)) {
        return current.filter((d) => d !== day);
      }
      return [...current, day].sort((a, b) => ORDER[a] - ORDER[b]);
    });
  };

  const handleStartChange = (
    _: DateTimePickerEvent,
    next: Date | undefined,
  ): void => {
    if (next) {
      setStartDate(next);
    }
  };

  const handleEndChange = (
    _: DateTimePickerEvent,
    next: Date | undefined,
  ): void => {
    if (next) {
      setEndDate(next);
    }
  };

  const handleSave = async (): Promise<void> => {
    const input: CreateScheduleInput = {
      name,
      startTime,
      endTime,
      days: selectedDays,
      isEnabled: true,
      selection,
    };

    const success = await run(async () => {
      validateScheduleInput(input);
      void haptic.commit();
      await addSchedule({ ...input, name: input.name.trim() });
    }, 'Could not create schedule.');

    if (success) {
      router.back();
    }
  };

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingVertical: 16, gap: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Typography variant="label" tone="muted">
            New schedule
          </Typography>
          <Typography variant="display-md" tone="ink">
            When to block.
          </Typography>
        </View>

        <View className="gap-3">
          <Typography variant="label" tone="faint">
            Name
          </Typography>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Focus window"
            placeholderTextColor={colors.inkFaint}
            className="bg-surface-raised rounded-xl px-5 py-4 text-[22px] font-semibold"
            style={{ color: colors.ink }}
          />
        </View>

        <View className="flex-row gap-8 justify-center">
          <View className="items-center gap-2">
            <Typography variant="label" tone="faint">
              Start
            </Typography>
            <DateTimePicker
              value={startDate}
              mode="time"
              display="spinner"
              themeVariant={isDark ? 'dark' : 'light'}
              onChange={handleStartChange}
              textColor={colors.ink}
            />
          </View>
          <View className="items-center gap-2">
            <Typography variant="label" tone="faint">
              End
            </Typography>
            <DateTimePicker
              value={endDate}
              mode="time"
              display="spinner"
              themeVariant={isDark ? 'dark' : 'light'}
              onChange={handleEndChange}
              textColor={colors.ink}
            />
          </View>
        </View>

        <View className="gap-3">
          <Typography variant="label" tone="faint">
            Repeat
          </Typography>
          <View className="flex-row flex-wrap gap-2">
            {DAYS.map((day) => {
              const active = selectedDays.includes(day.value);
              return (
                <Pressable
                  key={day.value}
                  onPress={() => toggleDay(day.value)}
                  className={`px-5 py-3 rounded-full ${
                    active ? 'bg-signal' : 'bg-surface-raised'
                  }`}
                >
                  <Typography
                    variant="body-md"
                    tone={active ? 'surface' : 'muted'}
                  >
                    {day.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? (
          <Typography variant="caption" tone="danger">
            {error}
          </Typography>
        ) : null}

        <View className="gap-3 pt-2">
          <Button
            title="Create schedule"
            variant="commit"
            onPress={() => void handleSave()}
            isLoading={isPending}
            disabled={isPending}
          />
          <Button
            title="Cancel"
            variant="abandon"
            onPress={() => router.back()}
            disabled={isPending}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
