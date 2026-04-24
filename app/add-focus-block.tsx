import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import {
  type ActivitySelectionMetadata,
  DeviceActivitySelectionSheetViewPersisted,
} from 'react-native-device-activity';
import { BlockingCard } from '../src/features/blocker/components/BlockingCard';
import { parseBlockedDomain } from '../src/features/blocker/domain';
import {
  BLOCK_ACTIVITY_SELECTION_ID,
  EMPTY_BLOCK_SELECTION,
  type PersistedActivitySelection,
  createActivitySelectionFromMetadata,
  selectionHasBlockedTargets,
} from '../src/features/blocker/types';
import { BlockFormCard } from '../src/features/schedule/components/BlockFormCard';
import { FormActions } from '../src/features/schedule/components/FormActions';
import { NotificationsCard } from '../src/features/schedule/components/NotificationsCard';
import { PresetRow } from '../src/features/schedule/components/PresetRow';
import { PRESETS, type PresetKind } from '../src/features/schedule/presets';
import type {
  DayOfWeek,
  FocusBlockInput,
} from '../src/features/schedule/types';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { validateFocusBlockInput } from '../src/features/schedule/validation';
import { useAdminState } from '../src/features/settings/useAdminState';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import {
  DAY_ORDER,
  dateToTimeString,
  timeStringToDate,
} from '../src/shared/days';
import { haptic } from '../src/shared/design/haptics';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';
import { requestNotificationPermissions } from '../src/shared/notifications';

export default function AddFocusBlockScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ?? null;
  const isEditing = editId !== null;

  const addFocusBlock = useFocusBlockStore((s) => s.addFocusBlock);
  const updateFocusBlock = useFocusBlockStore((s) => s.updateFocusBlock);
  const deleteFocusBlock = useFocusBlockStore((s) => s.deleteFocusBlock);
  const existing = useFocusBlockStore((s) =>
    editId ? s.focusBlocks.find((item) => item.id === editId) ?? null : null,
  );

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';

  const [name, setName] = useState<string>(existing?.name ?? 'Focus block');
  const [startDate, setStartDate] = useState<Date>(() =>
    timeStringToDate(existing?.startTime ?? '09:00'),
  );
  const [endDate, setEndDate] = useState<Date>(() =>
    timeStringToDate(existing?.endTime ?? '17:00'),
  );
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(
    existing ? [...existing.days] : ['mon', 'tue', 'wed', 'thu', 'fri'],
  );
  const [newDomain, setNewDomain] = useState('');
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [notifyOnStart, setNotifyOnStart] = useState(
    existing?.notifyOnStart ?? true,
  );
  const [notifyOnEnd, setNotifyOnEnd] = useState(
    existing?.notifyOnEnd ?? false,
  );
  const [activitySelection, setActivitySelection] =
    useState<PersistedActivitySelection>(
      existing?.selection.activitySelection ??
        EMPTY_BLOCK_SELECTION.activitySelection,
    );
  const [webDomains, setWebDomains] = useState<string[]>(
    existing ? [...existing.selection.webDomains] : [],
  );

  const { error, isPending, run } = useAsyncAction();

  useEffect(() => {
    if (isAdminLocked) {
      router.back();
    }
  }, [isAdminLocked, router]);

  const startTime = useMemo(() => dateToTimeString(startDate), [startDate]);
  const endTime = useMemo(() => dateToTimeString(endDate), [endDate]);

  const applyPreset = (kind: PresetKind): void => {
    void haptic.select();
    const preset = PRESETS[kind];
    setName(preset.name);
    setStartDate(timeStringToDate(preset.startTime));
    setEndDate(timeStringToDate(preset.endTime));
    setSelectedDays(preset.days);
    setNotifyOnStart(preset.notifyOnStart);
    setNotifyOnEnd(preset.notifyOnEnd);
    setWebDomains(preset.webDomains);
  };

  const toggleDay = (day: DayOfWeek): void => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]),
    );
  };

  const handleToggleNotify = async (
    value: boolean,
    setter: (next: boolean) => void,
  ): Promise<void> => {
    void haptic.select();
    if (value && !(await requestNotificationPermissions())) return;
    setter(value);
  };

  const addDomain = (): void => {
    const trimmed = newDomain.trim();
    if (!trimmed) return;
    void run(async () => {
      const domain = parseBlockedDomain(trimmed);
      if (domain === null) {
        throw new Error('Enter a valid domain like example.com.');
      }
      setWebDomains((current) =>
        current.includes(domain) ? current : [...current, domain],
      );
      setNewDomain('');
      void haptic.select();
    }, 'Invalid domain.');
  };

  const removeDomain = (domain: string): void => {
    setWebDomains((current) => current.filter((d) => d !== domain));
    void haptic.select();
  };

  const handleSelectionChange = (event: {
    nativeEvent: ActivitySelectionMetadata;
  }): Promise<boolean> =>
    run(async () => {
      void haptic.select();
      setActivitySelection(
        createActivitySelectionFromMetadata(event.nativeEvent),
      );
    }, 'Could not save selection.');

  const handleSave = async (): Promise<void> => {
    const input: FocusBlockInput = {
      name,
      startTime,
      endTime,
      days: selectedDays,
      isEnabled: existing?.isEnabled ?? true,
      selection: { activitySelection, webDomains },
      notifyOnStart,
      notifyOnEnd,
    };

    const success = await run(async () => {
      if (!selectionHasBlockedTargets(input.selection)) {
        throw new Error('Pick at least one app or site to block.');
      }
      validateFocusBlockInput(input);
      void haptic.commit();
      if (editId) {
        updateFocusBlock(editId, input);
      } else {
        addFocusBlock(input);
      }
    }, 'Could not save block.');

    if (success) {
      router.back();
    }
  };

  const handleDelete = (): void => {
    if (!editId) return;
    Alert.alert(
      'Delete Focus Block?',
      'This will permanently remove this focus block.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void haptic.abandon();
            deleteFocusBlock(editId);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <Screen padded={false} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 80,
            paddingTop: 12,
            gap: 32,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-2">
            <Typography variant="label" tone="muted">
              {isEditing ? 'Modify Block' : 'New Focus Block'}
            </Typography>
            <Typography variant="display-md" tone="ink">
              Set your rules.
            </Typography>
          </View>

          {!isEditing && <PresetRow onSelect={applyPreset} />}

          <BlockFormCard
            name={name}
            onNameChange={setName}
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
            selectedDays={selectedDays}
            onToggleDay={toggleDay}
          />

          <BlockingCard
            activitySelection={activitySelection}
            onOpenAppsPicker={() => setIsPickerVisible(true)}
            webDomains={webDomains}
            newDomain={newDomain}
            onNewDomainChange={setNewDomain}
            onAddDomain={addDomain}
            onRemoveDomain={removeDomain}
          />

          <NotificationsCard
            notifyOnStart={notifyOnStart}
            notifyOnEnd={notifyOnEnd}
            onChangeStart={(v) => void handleToggleNotify(v, setNotifyOnStart)}
            onChangeEnd={(v) => void handleToggleNotify(v, setNotifyOnEnd)}
          />

          {error ? (
            <Typography variant="caption" tone="danger">
              {error}
            </Typography>
          ) : null}

          <FormActions
            isEditing={isEditing}
            isPending={isPending}
            onSave={() => void handleSave()}
            onDelete={handleDelete}
            onCancel={() => router.back()}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {isPickerVisible && (
        <DeviceActivitySelectionSheetViewPersisted
          familyActivitySelectionId={BLOCK_ACTIVITY_SELECTION_ID}
          onSelectionChange={(event) => {
            void handleSelectionChange(event);
          }}
          onDismissRequest={() => setIsPickerVisible(false)}
        />
      )}
    </Screen>
  );
}
