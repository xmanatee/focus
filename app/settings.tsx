import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import type { DayOfWeek } from '../src/features/schedule/types';
import type {
  AdminState,
  SetupBlock,
} from '../src/features/settings/adminState';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { Button } from '../src/shared/components/Button';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import {
  DAYS,
  DAY_ORDER,
  dateToTimeString,
  formatRelative,
  timeStringToDate,
} from '../src/shared/days';
import { haptic } from '../src/shared/design/haptics';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';
import { requestNotificationPermissions } from '../src/shared/notifications';

function nextUnlockLabel(state: AdminState, now: Date): string {
  if (state.kind === 'unlocked') {
    return '';
  }
  if (!state.nextUnlock) {
    return 'Setup block needs to be configured.';
  }
  return `Next unlock ${formatRelative(state.nextUnlock.at, now)}.`;
}

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const existing = useSettingsStore((s) => s.setupBlock);
  const setSetupBlock = useSettingsStore((s) => s.setSetupBlock);
  const clearSetupBlock = useSettingsStore((s) => s.clearSetupBlock);
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
  const [notifyOnStart, setNotifyOnStart] = useState(
    existing?.notifyOnStart ?? true,
  );
  const { error, isPending, run } = useAsyncAction();

  useEffect(() => {
    if (!existing) {
      return;
    }
    setSelectedDays([...existing.days]);
    setStartDate(timeStringToDate(existing.startTime));
    setEndDate(timeStringToDate(existing.endTime));
    setNotifyOnStart(existing.notifyOnStart);
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
      return [...current, day].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]);
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

  const handleToggleNotify = async (value: boolean) => {
    if (!isUnlocked) return;
    void haptic.select();
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
    }
    setNotifyOnStart(value);
  };

  const handleSave = async (): Promise<void> => {
    const nextBlock: SetupBlock = {
      days: selectedDays,
      startTime,
      endTime,
      notifyOnStart,
    };
    const success = await run(async () => {
      void haptic.commit();
      setSetupBlock(nextBlock);
    }, 'Could not save setup block.');
    if (success) {
      router.back();
    }
  };

  const confirmClear = (): void => {
    Alert.alert(
      'Remove setup block?',
      'All your focus blocks will be editable any time after this.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void haptic.abandon();
            void run(async () => {
              clearSetupBlock();
            }, 'Could not remove setup block.');
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false} edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 60,
          paddingTop: 12,
          gap: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-2">
          <Typography variant="label" tone="muted">
            Restriction Settings
          </Typography>
          <Typography variant="display-md" tone="ink">
            Configure Lock-in.
          </Typography>
          <Typography variant="body" tone="muted" className="mt-2">
            The Lock-in mechanism prevents you from disabling or editing your
            focus blocks when you are most likely to be distracted.
          </Typography>
        </View>

        <View className="gap-6 bg-surface-raised rounded-3xl p-6 shadow-sm border border-divider/10">
          <View className="flex-row items-center justify-between">
            <Typography variant="h3" tone="ink">
              Setup Block
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
                {isUnlocked ? 'Editable' : 'Locked'}
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
              Active Days
            </Typography>
            <View className="flex-row justify-between">
              {DAYS.map((day) => {
                const active = selectedDays.includes(day.value);
                return (
                  <Pressable
                    key={day.value}
                    onPress={() => toggleDay(day.value)}
                    disabled={!isUnlocked}
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      active ? 'bg-signal' : 'bg-surface-sunken'
                    } ${!isUnlocked ? 'opacity-50' : ''}`}
                  >
                    <Typography
                      variant="caption"
                      tone={active ? 'surface' : 'muted'}
                    >
                      {day.label.charAt(0)}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="flex-row gap-4 justify-between bg-surface-sunken/60 rounded-2xl px-6 py-5 items-center">
            <View className="items-start gap-1">
              <Typography variant="label" tone="faint">
                Starts
              </Typography>
              <DateTimePicker
                value={startDate}
                mode="time"
                display="default"
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={handleStartChange}
                disabled={!isUnlocked}
                textColor={colors.ink}
              />
            </View>
            <View className="w-[1px] h-10 bg-divider/20" />
            <View className="items-end gap-1">
              <Typography variant="label" tone="faint">
                Ends
              </Typography>
              <DateTimePicker
                value={endDate}
                mode="time"
                display="default"
                themeVariant={isDark ? 'dark' : 'light'}
                onChange={handleEndChange}
                disabled={!isUnlocked}
                textColor={colors.ink}
              />
            </View>
          </View>

          <View className="gap-4 mt-2">
            <Typography variant="label" tone="faint">
              Notifications
            </Typography>
            <View className="bg-surface-sunken/40 rounded-2xl p-5 border border-divider/5">
              <View className="flex-row items-center justify-between">
                <View className="gap-1 flex-1 mr-4">
                  <Typography variant="body-md" tone="ink">
                    Setup Reminder
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    Alert when this setup block begins.
                  </Typography>
                </View>
                <Switch
                  value={notifyOnStart}
                  onValueChange={(v) => void handleToggleNotify(v)}
                  disabled={!isUnlocked}
                  trackColor={{ true: colors.signal, false: colors.divider }}
                />
              </View>
            </View>
          </View>

          {error ? (
            <Typography variant="caption" tone="danger">
              {error}
            </Typography>
          ) : null}

          <View className="gap-2 mt-2">
            <Button
              title={existing ? 'Update setup block' : 'Save setup block'}
              variant="commit"
              onPress={() => void handleSave()}
              isLoading={isPending}
              disabled={isPending || !isUnlocked}
            />
            {existing ? (
              <Button
                title="Remove setup block"
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
