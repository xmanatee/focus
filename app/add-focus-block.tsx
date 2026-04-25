import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { DeviceActivitySelectionSheetViewPersisted } from 'react-native-device-activity';
import { BlockingCard } from '../src/features/blocker/components/BlockingCard';
import { parseBlockedDomain } from '../src/features/blocker/domain';
import {
  EMPTY_BLOCK_SELECTION,
  selectionHasBlockedTargets,
} from '../src/features/blocker/types';
import { BlockFormCard } from '../src/features/schedule/components/BlockFormCard';
import { FormActions } from '../src/features/schedule/components/FormActions';
import { NotificationsCard } from '../src/features/schedule/components/NotificationsCard';
import { PresetRow } from '../src/features/schedule/components/PresetRow';
import { PRESETS, type PresetKind } from '../src/features/schedule/presets';
import type { DayOfWeek } from '../src/features/schedule/types';
import { useActivitySelection } from '../src/features/schedule/useActivitySelection';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
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
import { newId } from '../src/shared/storage';

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

  const [blockId] = useState<string>(() => editId ?? newId());
  const [templatePromptKind, setTemplatePromptKind] =
    useState<PresetKind | null>(null);

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
  const [notifyOnStart, setNotifyOnStart] = useState(
    existing?.notifyOnStart ?? true,
  );
  const [notifyOnEnd, setNotifyOnEnd] = useState(
    existing?.notifyOnEnd ?? false,
  );
  const [webDomains, setWebDomains] = useState<string[]>(
    existing ? [...existing.selection.webDomains] : [],
  );

  const selection = useActivitySelection(
    blockId,
    editId,
    existing?.selection.activitySelection ??
      EMPTY_BLOCK_SELECTION.activitySelection,
  );
  const { pickerSession } = selection;

  const { error, isPending, run } = useAsyncAction();

  useEffect(() => {
    if (isAdminLocked) router.back();
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

    const templateSelection = selection.applyTemplate(kind);
    if (templateSelection === 'needs-setup') {
      setTemplatePromptKind(kind);
      return;
    }
    setTemplatePromptKind(null);
  };

  const toggleDay = (day: DayOfWeek): void => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]),
    );
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

  const handleSave = async (): Promise<void> => {
    const input = {
      name,
      startTime,
      endTime,
      days: selectedDays,
      isEnabled: existing?.isEnabled ?? true,
      selection: {
        activitySelection: selection.activitySelection,
        webDomains,
      },
      notifyOnStart,
      notifyOnEnd,
    };

    const success = await run(async () => {
      if (!selectionHasBlockedTargets(input.selection)) {
        throw new Error('Pick at least one app or site to block.');
      }
      if (input.notifyOnStart || input.notifyOnEnd) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          throw new Error(
            'Notifications permission is required for this block. Enable it in Settings or turn off the notification toggles.',
          );
        }
      }
      void haptic.commit();
      if (editId) updateFocusBlock(editId, input);
      else addFocusBlock(blockId, input);
      selection.markSaved();
    }, 'Could not save block.');

    if (success) router.back();
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
            paddingHorizontal: 16,
            paddingBottom: 60,
            paddingTop: 32,
            gap: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Typography variant="display-md" tone="ink">
            {isEditing ? 'Edit block.' : 'Set your rules.'}
          </Typography>

          {!isEditing && (
            <PresetRow
              onSelect={applyPreset}
              onLongPress={selection.openTemplatePicker}
            />
          )}
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
            activitySelection={selection.activitySelection}
            onOpenAppsPicker={selection.openBlockPicker}
            webDomains={webDomains}
            newDomain={newDomain}
            onNewDomainChange={setNewDomain}
            onAddDomain={addDomain}
            onRemoveDomain={removeDomain}
          />

          {templatePromptKind !== null ? (
            <Typography variant="caption" tone="muted">
              Hold "{PRESETS[templatePromptKind].name}" to choose which apps it
              blocks.
            </Typography>
          ) : null}

          <NotificationsCard
            notifyOnStart={notifyOnStart}
            notifyOnEnd={notifyOnEnd}
            onChangeStart={(v) => {
              void haptic.select();
              setNotifyOnStart(v);
            }}
            onChangeEnd={(v) => {
              void haptic.select();
              setNotifyOnEnd(v);
            }}
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

      {pickerSession ? (
        <DeviceActivitySelectionSheetViewPersisted
          familyActivitySelectionId={pickerSession.slotId}
          onSelectionChange={(event) =>
            pickerSession.onSelectionChange(event.nativeEvent)
          }
          onDismissRequest={selection.closePicker}
        />
      ) : null}
    </Screen>
  );
}
