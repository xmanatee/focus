import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { DeviceActivitySelectionSheetViewPersisted } from 'react-native-device-activity';
import { BlockingCard } from '../src/features/blocker/components/BlockingCard';
import { parseBlockedDomain } from '../src/features/blocker/domain';
import { EMPTY_BLOCK_SELECTION } from '../src/features/blocker/types';
import { getLocalDeviceId } from '../src/features/device/deviceId';
import { useLocalDeviceId } from '../src/features/device/useLocalDeviceId';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import { BlockFormCard } from '../src/features/schedule/components/BlockFormCard';
import { DeviceScopeCard } from '../src/features/schedule/components/DeviceScopeCard';
import { FormActions } from '../src/features/schedule/components/FormActions';
import { NotificationsCard } from '../src/features/schedule/components/NotificationsCard';
import { PresetRow } from '../src/features/schedule/components/PresetRow';
import { RuleCard } from '../src/features/schedule/components/RuleCard';
import { StrictModeCard } from '../src/features/schedule/components/StrictModeCard';
import { focusBlockRunnableOnDevice } from '../src/features/schedule/deviceRuntime';
import { resolveEditPolicy } from '../src/features/schedule/editPolicy';
import { activitySelectionNeedsLocalSlot } from '../src/features/schedule/localActivitySelection';
import { PRESETS, type PresetKind } from '../src/features/schedule/presets';
import { confirmStrictModeOn } from '../src/features/schedule/strictModeConfirm';
import { useActivitySelection } from '../src/features/schedule/useActivitySelection';
import { useFocusBlockForm } from '../src/features/schedule/useFocusBlockForm';
import { useFocusBlockSave } from '../src/features/schedule/useFocusBlockSave';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { InfoBanner } from '../src/shared/components/InfoBanner';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';
import { useDismiss } from '../src/shared/hooks/useDismiss';
import { newId } from '../src/shared/storage';

export default function AddFocusBlockScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ?? null;
  const isEditing = editId !== null;

  const existing = useFocusBlockStore((s) =>
    editId ? s.focusBlocks.find((item) => item.id === editId) ?? null : null,
  );

  const [blockId] = useState<string>(() => editId ?? newId());
  const [newDomain, setNewDomain] = useState('');
  const [templatePromptKind, setTemplatePromptKind] =
    useState<PresetKind | null>(null);

  const { state: adminState, now } = useAdminState();
  const setupBlock = useSettingsStore((s) => s.setupBlock);
  const tamperReady = useProtectionPosture().score === 'full';
  const deviceId = useLocalDeviceId();
  const existingOnThisDevice =
    existing === null ? null : focusBlockRunnableOnDevice(existing, deviceId);

  const policy = resolveEditPolicy(
    adminState,
    isEditing ? existingOnThisDevice : null,
    now,
  );
  const readOnly = policy.readOnly;

  const form = useFocusBlockForm(existing);
  const selection = useActivitySelection(
    blockId,
    editId,
    existing?.selection.activitySelection ??
      EMPTY_BLOCK_SELECTION.activitySelection,
  );
  const { pickerSession } = selection;
  const dismiss = useDismiss();
  const needsDeviceSelection = activitySelectionNeedsLocalSlot(
    blockId,
    selection.activitySelection,
  );
  const usesScheduleWindow = form.rule.kind !== 'dailyBudget';

  const { error, isPending, run, save, requestDelete } = useFocusBlockSave({
    editId,
    newBlockId: blockId,
    buildInput: async () => {
      const localDeviceId = deviceId ?? (await getLocalDeviceId());
      return {
        name: form.name,
        startTime: form.startTime,
        endTime: form.endTime,
        days: form.selectedDays,
        isEnabled: existing?.isEnabled ?? true,
        enabledDeviceIds: existing?.enabledDeviceIds ?? [localDeviceId],
        scope:
          form.scopeChoice === 'allDevices'
            ? { kind: 'allDevices' }
            : { kind: 'device', deviceId: localDeviceId },
        rule: form.rule,
        selection: {
          activitySelection: selection.activitySelection,
          webDomains: form.webDomains,
        },
        notifyOnStart: usesScheduleWindow && form.notifyOnStart,
        notifyOnEnd: usesScheduleWindow && form.notifyOnEnd,
        strict: form.strict,
      };
    },
    markSelectionSaved: selection.markSaved,
    dismiss,
  });

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
    if (!next) {
      form.setStrict(false);
      return;
    }
    confirmStrictModeOn({
      tamperReady,
      onConfirm: () => form.setStrict(true),
      onSetUpFirst: () => router.push('/protection'),
    });
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

        {policy.message && (
          <InfoBanner variant="info" title={policy.title ?? undefined}>
            {policy.message}
          </InfoBanner>
        )}

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
          showTimeRange={usesScheduleWindow}
          disabled={readOnly}
        />
        <RuleCard
          value={form.rule}
          onChange={(next) => {
            void haptic.select();
            form.setRule(next);
          }}
          disabled={readOnly}
        />
        <DeviceScopeCard
          value={form.scopeChoice}
          onChange={(next) => {
            void haptic.select();
            form.setScopeChoice(next);
          }}
          disabled={readOnly}
        />
        <BlockingCard
          activitySelection={selection.activitySelection}
          needsDeviceSelection={needsDeviceSelection}
          requiresActivitySelection={
            form.rule.kind === 'dailyBudget' ||
            form.rule.kind === 'allowDuringScheduleWithBudget'
          }
          onOpenAppsPicker={selection.openBlockPicker}
          webDomains={form.webDomains}
          newDomain={newDomain}
          onNewDomainChange={setNewDomain}
          onAddDomain={addDomain}
          onRemoveDomain={removeDomain}
          disabled={readOnly}
        />

        {setupBlock === null && (
          <StrictModeCard
            value={form.strict}
            onChange={handleStrictChange}
            tamperReady={tamperReady}
            disabled={readOnly}
          />
        )}

        {templatePromptKind !== null ? (
          <Typography variant="caption" tone="muted">
            Hold "{PRESETS[templatePromptKind].name}" to choose which apps it
            blocks.
          </Typography>
        ) : null}

        {usesScheduleWindow && (
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
            disabled={readOnly}
          />
        )}

        {error ? (
          <Typography variant="caption" tone="danger">
            {error}
          </Typography>
        ) : null}

        <FormActions
          isEditing={isEditing}
          isPending={isPending}
          readOnly={readOnly}
          onSave={() => void save()}
          onDelete={requestDelete}
          onCancel={dismiss}
        />
      </ScrollView>

      {pickerSession && (
        <DeviceActivitySelectionSheetViewPersisted
          familyActivitySelectionId={pickerSession.slotId}
          includeEntireCategory={pickerSession.includeEntireCategory}
          onSelectionChange={(event) =>
            pickerSession.onSelectionChange(event.nativeEvent)
          }
          onDismissRequest={selection.closePicker}
        />
      )}
    </Screen>
  );
}
