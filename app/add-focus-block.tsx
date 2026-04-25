import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { DeviceActivitySelectionSheetViewPersisted } from 'react-native-device-activity';
import { BlockingCard } from '../src/features/blocker/components/BlockingCard';
import { parseBlockedDomain } from '../src/features/blocker/domain';
import {
  EMPTY_BLOCK_SELECTION,
  selectionHasBlockedTargets,
} from '../src/features/blocker/types';
import { protectionCopy } from '../src/features/protection/copy';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import { BlockFormCard } from '../src/features/schedule/components/BlockFormCard';
import { FormActions } from '../src/features/schedule/components/FormActions';
import { LockInCard } from '../src/features/schedule/components/LockInCard';
import { NotificationsCard } from '../src/features/schedule/components/NotificationsCard';
import { PresetRow } from '../src/features/schedule/components/PresetRow';
import { PRESETS, type PresetKind } from '../src/features/schedule/presets';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useActivitySelection } from '../src/features/schedule/useActivitySelection';
import { useFocusBlockForm } from '../src/features/schedule/useFocusBlockForm';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { useAdminState } from '../src/features/settings/useAdminState';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';
import { useDismiss } from '../src/shared/hooks/useDismiss';
import { requestNotificationPermissions } from '../src/shared/notifications';
import { newId } from '../src/shared/storage';

export default function AddFocusBlockScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ?? null;
  const isEditing = editId !== null;

  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const addFocusBlock = useFocusBlockStore((s) => s.addFocusBlock);
  const updateFocusBlock = useFocusBlockStore((s) => s.updateFocusBlock);
  const deleteFocusBlock = useFocusBlockStore((s) => s.deleteFocusBlock);
  const existing = useFocusBlockStore((s) =>
    editId ? s.focusBlocks.find((item) => item.id === editId) ?? null : null,
  );

  const [blockId] = useState<string>(() => editId ?? newId());
  const [newDomain, setNewDomain] = useState('');
  const [templatePromptKind, setTemplatePromptKind] =
    useState<PresetKind | null>(null);

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const { isStrict } = useActiveBlock(focusBlocks);
  const tamperReady = useProtectionPosture().score === 'full';

  const form = useFocusBlockForm(existing);

  const selection = useActivitySelection(
    blockId,
    editId,
    existing?.selection.activitySelection ??
      EMPTY_BLOCK_SELECTION.activitySelection,
  );
  const { pickerSession } = selection;

  const { error, isPending, run } = useAsyncAction();
  const dismiss = useDismiss();

  useEffect(() => {
    if (isAdminLocked || isStrict) dismiss();
  }, [isAdminLocked, isStrict, dismiss]);

  const handleApplyPreset = (kind: PresetKind): void => {
    void haptic.select();
    form.applyPreset(kind);
    const result = selection.applyTemplate(kind);
    setTemplatePromptKind(result === 'needs-setup' ? kind : null);
  };

  const addDomain = (): void => {
    const trimmed = newDomain.trim();
    if (!trimmed) return;
    void run(async () => {
      const domain = parseBlockedDomain(trimmed);
      if (domain === null) {
        throw new Error('Enter a valid domain like example.com.');
      }
      if (!form.webDomains.includes(domain)) {
        form.setWebDomains([...form.webDomains, domain]);
      }
      setNewDomain('');
      void haptic.select();
    }, 'Invalid domain.');
  };

  const removeDomain = (domain: string): void => {
    form.setWebDomains(form.webDomains.filter((d) => d !== domain));
    void haptic.select();
  };

  const handleStrictChange = (next: boolean): void => {
    void haptic.select();
    if (!next || tamperReady) {
      form.setStrict(next);
      return;
    }
    Alert.alert(
      protectionCopy.lockInCard.softBlockTitle,
      protectionCopy.lockInCard.softBlockBody,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: protectionCopy.lockInCard.softBlockSetup,
          onPress: () => router.push('/protection'),
        },
        {
          text: protectionCopy.lockInCard.softBlockAnyway,
          style: 'destructive',
          onPress: () => form.setStrict(true),
        },
      ],
    );
  };

  const handleSave = async (): Promise<void> => {
    const input = {
      name: form.name,
      startTime: form.startTime,
      endTime: form.endTime,
      days: [...form.selectedDays],
      isEnabled: existing?.isEnabled ?? true,
      selection: {
        activitySelection: selection.activitySelection,
        webDomains: [...form.webDomains],
      },
      notifyOnStart: form.notifyOnStart,
      notifyOnEnd: form.notifyOnEnd,
      strict: form.strict,
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

    if (success) dismiss();
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
            dismiss();
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
          paddingHorizontal: 16,
          paddingBottom: 60,
          paddingTop: 32,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Typography variant="display-md" tone="ink">
          {isEditing ? 'Edit block.' : 'Set your rules.'}
        </Typography>

        {!isEditing && (
          <PresetRow
            onSelect={handleApplyPreset}
            onLongPress={selection.openTemplatePicker}
          />
        )}
        <BlockFormCard
          name={form.name}
          onNameChange={form.setName}
          startDate={form.startDate}
          endDate={form.endDate}
          onStartChange={form.setStartDate}
          onEndChange={form.setEndDate}
          selectedDays={form.selectedDays}
          onToggleDay={form.toggleDay}
        />
        <BlockingCard
          activitySelection={selection.activitySelection}
          onOpenAppsPicker={selection.openBlockPicker}
          webDomains={form.webDomains}
          newDomain={newDomain}
          onNewDomainChange={setNewDomain}
          onAddDomain={addDomain}
          onRemoveDomain={removeDomain}
        />

        <LockInCard
          value={form.strict}
          onChange={handleStrictChange}
          tamperReady={tamperReady}
        />

        {templatePromptKind !== null ? (
          <Typography variant="caption" tone="muted">
            Hold "{PRESETS[templatePromptKind].name}" to choose which apps it
            blocks.
          </Typography>
        ) : null}

        <NotificationsCard
          notifyOnStart={form.notifyOnStart}
          notifyOnEnd={form.notifyOnEnd}
          onChangeStart={(v) => {
            void haptic.select();
            form.setNotifyOnStart(v);
          }}
          onChangeEnd={(v) => {
            void haptic.select();
            form.setNotifyOnEnd(v);
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
          onCancel={dismiss}
        />
      </ScrollView>

      {pickerSession ? (
        <DeviceActivitySelectionSheetViewPersisted
          familyActivitySelectionId={pickerSession.slotId}
          includeEntireCategory={pickerSession.includeEntireCategory}
          onSelectionChange={(event) =>
            pickerSession.onSelectionChange(event.nativeEvent)
          }
          onDismissRequest={selection.closePicker}
        />
      ) : null}
    </Screen>
  );
}
