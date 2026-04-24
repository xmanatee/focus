import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { DayOfWeek } from '../src/features/schedule/types';
import type {
  AdminState,
  SetupBlock,
} from '../src/features/settings/adminState';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { Button } from '../src/shared/components/Button';
import { DayPicker } from '../src/shared/components/DayPicker';
import { NotifyRow } from '../src/shared/components/NotifyRow';
import { Screen } from '../src/shared/components/Screen';
import { TimeRangePicker } from '../src/shared/components/TimeRangePicker';
import { Typography } from '../src/shared/components/Typography';
import {
  DAY_ORDER,
  dateToTimeString,
  formatRelative,
  timeStringToDate,
} from '../src/shared/days';
import { haptic } from '../src/shared/design/haptics';
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
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]),
    );
  };

  const handleToggleNotify = async (value: boolean): Promise<void> => {
    if (!isUnlocked) return;
    void haptic.select();
    if (value && !(await requestNotificationPermissions())) return;
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
          paddingHorizontal: 20,
          paddingBottom: 60,
          paddingTop: 32,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <Typography variant="display-md" tone="ink">
            Configure Lock-in.
          </Typography>
          <Typography variant="body" tone="muted">
            The Lock-in mechanism prevents you from disabling or editing your
            focus blocks when you are most likely to be distracted.
          </Typography>
        </View>

        <View className="gap-4 bg-surface-raised rounded-3xl p-5 shadow-sm border border-divider/10">
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

          <View className="h-[1px] bg-divider" />

          <View className="gap-2">
            <Typography variant="label" tone="faint">
              Active Days
            </Typography>
            <DayPicker
              selected={selectedDays}
              onToggle={toggleDay}
              disabled={!isUnlocked}
            />
          </View>

          <View className="h-[1px] bg-divider" />

          <TimeRangePicker
            start={startDate}
            end={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            disabled={!isUnlocked}
          />

          <View className="h-[1px] bg-divider" />

          <NotifyRow
            title="Setup Reminder"
            subtitle="Alert when this setup block begins."
            value={notifyOnStart}
            onChange={(v) => void handleToggleNotify(v)}
            disabled={!isUnlocked}
          />

          {error ? (
            <Typography variant="caption" tone="danger">
              {error}
            </Typography>
          ) : null}

          <View className="gap-2 pt-1">
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
