import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { DiagnosticsCard } from '../src/features/diagnostics/components/DiagnosticsCard';
import { protectionCopy } from '../src/features/protection/copy';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import type { DayOfWeek } from '../src/features/schedule/types';
import type { SetupBlock } from '../src/features/settings/adminState';
import { SetupBlockEditorCard } from '../src/features/settings/components/SetupBlockEditorCard';
import { useSetupBlockDeviceStore } from '../src/features/settings/setupBlockDeviceStore';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { Card } from '../src/shared/components/Card';
import { Icon } from '../src/shared/components/Icon';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import {
  DAY_ORDER,
  dateToTimeString,
  timeStringToDate,
} from '../src/shared/days';
import { haptic } from '../src/shared/design/haptics';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';
import { useDismiss } from '../src/shared/hooks/useDismiss';
import { requestNotificationPermissions } from '../src/shared/notifications';

export default function SettingsScreen(): JSX.Element {
  const router = useRouter();
  const dismiss = useDismiss();
  const existing = useSettingsStore((s) => s.setupBlock);
  const setSetupBlock = useSettingsStore((s) => s.setSetupBlock);
  const clearSetupBlock = useSettingsStore((s) => s.clearSetupBlock);
  const enableOnDevice = useSetupBlockDeviceStore((s) => s.enableOnDevice);
  const disableOnDevice = useSetupBlockDeviceStore((s) => s.disableOnDevice);
  const { isEnabledOnDevice, state, now } = useAdminState();

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

  const posture = useProtectionPosture();
  const okCount = posture.defenses.filter((d) => d.ok).length;
  const totalDefenses = posture.defenses.length;
  const protectionSubtitle =
    posture.score === 'none'
      ? protectionCopy.settingsRow.none
      : posture.score === 'full'
        ? protectionCopy.settingsRow.full
        : protectionCopy.settingsRow.partial(okCount, totalDefenses);

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
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]),
    );
  };

  const handleSave = async (
    nextAction: 'saveOnly' | 'saveAndEnable',
  ): Promise<void> => {
    const nextBlock: SetupBlock = {
      days: selectedDays,
      startTime,
      endTime,
      notifyOnStart,
    };
    const shouldEnableOnDevice =
      nextAction === 'saveAndEnable' || isEnabledOnDevice;
    const isEnablingOnDevice =
      nextAction === 'saveAndEnable' && !isEnabledOnDevice;
    const dialogMessage = isEnablingOnDevice
      ? 'You will only be able to edit your focus blocks during your setup window on this device. Please review your blocks carefully before turning this on.'
      : existing === null
        ? 'Save the synced setup window without turning it on for this device yet?'
        : 'Update the synced setup window without changing whether this device enforces it.';

    const performSave = async (): Promise<void> => {
      const success = await run(async () => {
        if (shouldEnableOnDevice && nextBlock.notifyOnStart) {
          const granted = await requestNotificationPermissions();
          if (!granted) {
            throw new Error(
              'Notifications permission is required for this block. Enable it in Settings or turn off the notification toggles.',
            );
          }
        }
        void haptic.commit();
        setSetupBlock(nextBlock);
        if (nextAction === 'saveAndEnable') {
          enableOnDevice();
        }
      }, 'Could not save setup block.');
      if (success) dismiss();
    };

    Alert.alert(
      isEnablingOnDevice
        ? existing === null
          ? 'Turn on Lock-in?'
          : 'Save and turn on?'
        : existing === null
          ? 'Save Lock-in?'
          : 'Update Lock-in?',
      dialogMessage,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isEnablingOnDevice ? 'Turn on' : 'Save',
          onPress: () => void performSave(),
        },
      ],
    );
  };

  const confirmDisableOnDevice = (): void => {
    Alert.alert(
      'Turn off on this device?',
      'This iPhone or iPad will stop using the setup window for edit protection. Other devices keep their current lock-in state.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn off',
          style: 'destructive',
          onPress: () => {
            void haptic.abandon();
            disableOnDevice();
          },
        },
      ],
    );
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
            clearSetupBlock();
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false} edges={['bottom']} edgeEffect="soft">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
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
            The setup window syncs through iCloud, but each iPhone or iPad
            decides for itself when to enforce it.
          </Typography>
        </View>

        <Card onPress={() => router.push('/protection')}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <Icon
                name="shield.fill"
                size={22}
                tone={posture.score === 'none' ? 'muted' : 'signal'}
              />
              <View className="flex-1 gap-0.5">
                <Typography variant="body-md" tone="ink">
                  {protectionCopy.settingsRow.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {protectionSubtitle}
                </Typography>
              </View>
            </View>
            <Icon name="chevron.right" size={16} tone="faint" />
          </View>
        </Card>

        <SetupBlockEditorCard
          endDate={endDate}
          error={error}
          existing={existing}
          isEnabledOnDevice={isEnabledOnDevice}
          isLoading={isPending}
          now={now}
          notifyOnStart={notifyOnStart}
          onChangeEnd={setEndDate}
          onChangeNotifyOnStart={(value) => {
            void haptic.select();
            setNotifyOnStart(value);
          }}
          onChangeStart={setStartDate}
          onRemove={confirmClear}
          onSaveAndEnable={() => void handleSave('saveAndEnable')}
          onSaveOnly={() => void handleSave('saveOnly')}
          onToggleDay={toggleDay}
          onTurnOff={confirmDisableOnDevice}
          selectedDays={selectedDays}
          startDate={startDate}
          state={state}
        />

        <DiagnosticsCard />
      </ScrollView>
    </Screen>
  );
}
