import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import type { DayOfWeek } from '../src/features/schedule/types';
import type {
  AdminState,
  SetupWindow,
} from '../src/features/settings/adminState';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
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
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date;
}

function dateToTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function nextUnlockLabel(state: AdminState, now: Date): string {
  if (state.kind === 'unlocked') {
    return '';
  }
  if (!state.nextUnlock) {
    return 'Setup hours need to be configured.';
  }
  const deltaMs = state.nextUnlock.at.getTime() - now.getTime();
  const hours = Math.max(1, Math.round(deltaMs / 3_600_000));
  if (hours < 24) {
    return `Next unlock in ${hours} hr.`;
  }
  const days = Math.round(hours / 24);
  return `Next unlock in ${days} day${days === 1 ? '' : 's'}.`;
}

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const existing = useSettingsStore((s) => s.setupWindow);
  const setSetupWindow = useSettingsStore((s) => s.setSetupWindow);
  const clearSetupWindow = useSettingsStore((s) => s.clearSetupWindow);
  const { state, now } = useAdminState();

  const isUnlocked = state.kind === 'unlocked';

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    existing ? [...existing.days] : ['sun'],
  );
  const [startDate, setStartDate] = useState(() =>
    timeStringToDate(existing?.startTime ?? '20:00'),
  );
  const [endDate, setEndDate] = useState(() =>
    timeStringToDate(existing?.endTime ?? '21:00'),
  );
  const { error, isPending, run } = useAsyncAction();

  useEffect(() => {
    if (!existing) {
      return;
    }
    setSelectedDays([...existing.days]);
    setStartDate(timeStringToDate(existing.startTime));
    setEndDate(timeStringToDate(existing.endTime));
  }, [existing]);

  const startTime = useMemo(() => dateToTimeString(startDate), [startDate]);
  const endTime = useMemo(() => dateToTimeString(endDate), [endDate]);

  const toggleDay = (day: DayOfWeek): void => {
    if (!isUnlocked) return;
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
    if (next) setStartDate(next);
  };

  const handleEndChange = (
    _: DateTimePickerEvent,
    next: Date | undefined,
  ): void => {
    if (next) setEndDate(next);
  };

  const handleSave = async (): Promise<void> => {
    const nextWindow: SetupWindow = {
      days: selectedDays,
      startTime,
      endTime,
    };
    const success = await run(async () => {
      void haptic.commit();
      setSetupWindow(nextWindow);
    }, 'Could not save setup hours.');
    if (success) {
      router.back();
    }
  };

  const confirmClear = (): void => {
    Alert.alert(
      'Remove setup hours?',
      'Blocklist and schedules will be editable any time after this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void haptic.abandon();
            void run(async () => {
              clearSetupWindow();
            }, 'Could not remove setup hours.');
          },
        },
      ],
    );
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
            Settings
          </Typography>
          <Typography variant="display-md" tone="ink">
            Lock yourself in.
          </Typography>
          <Typography variant="body" tone="muted" className="mt-2">
            Pick a narrow weekly window for making changes. Outside it, nothing
            about your blocking can be paused, cancelled, or edited — including
            this screen.
          </Typography>
        </View>

        <View className="gap-4 bg-surface-raised rounded-2xl p-5">
          <View className="flex-row items-center justify-between">
            <Typography variant="h3" tone="ink">
              Setup hours
            </Typography>
            <View
              className={`rounded-full px-3 py-1 ${
                isUnlocked ? 'bg-signal' : 'bg-surface-sunken'
              }`}
            >
              <Typography
                variant="caption"
                tone={isUnlocked ? 'surface' : 'muted'}
              >
                {isUnlocked ? 'Unlocked' : 'Locked'}
              </Typography>
            </View>
          </View>

          {!isUnlocked && existing ? (
            <Typography variant="caption" tone="muted">
              {nextUnlockLabel(state, now)}
            </Typography>
          ) : null}

          <View className="gap-3">
            <Typography variant="label" tone="faint">
              Days
            </Typography>
            <View className="flex-row flex-wrap gap-2">
              {DAYS.map((day) => {
                const active = selectedDays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    disabled={!isUnlocked}
                    className={`px-4 py-2 rounded-full ${
                      active ? 'bg-signal' : 'bg-surface-sunken'
                    } ${!isUnlocked ? 'opacity-50' : ''}`}
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
                disabled={!isUnlocked}
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
                disabled={!isUnlocked}
                textColor={colors.ink}
              />
            </View>
          </View>

          {error ? (
            <Typography variant="caption" tone="danger">
              {error}
            </Typography>
          ) : null}

          <View className="gap-2">
            <Button
              title={existing ? 'Update setup hours' : 'Save setup hours'}
              variant="commit"
              onPress={() => void handleSave()}
              isLoading={isPending}
              disabled={isPending || !isUnlocked}
            />
            {existing ? (
              <Button
                title="Remove setup hours"
                variant="abandon"
                onPress={confirmClear}
                disabled={isPending || !isUnlocked}
              />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
