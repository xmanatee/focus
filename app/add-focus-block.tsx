import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import {
  DeviceActivitySelectionSheetViewPersisted,
  type ActivitySelectionMetadata,
} from 'react-native-device-activity';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../src/features/blocker/constants';
import {
  EMPTY_BLOCK_SELECTION,
  createActivitySelectionFromMetadata,
  selectionHasBlockedTargets,
} from '../src/features/blocker/types';
import { useBlocklistStore } from '../src/features/blocker/useBlocklistStore';
import type { DayOfWeek, FocusBlockInput } from '../src/features/schedule/types';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { validateFocusBlockInput } from '../src/features/schedule/validation';
import { useAdminState } from '../src/features/settings/useAdminState';
import { Button } from '../src/shared/components/Button';
import { Icon } from '../src/shared/components/Icon';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import {
  DAYS,
  DAY_ORDER,
  dateToTimeString,
  timeStringToDate,
} from '../src/shared/days';
import { haptic } from '../src/shared/design/haptics';
import { useIsDark, useThemeColors } from '../src/shared/design/theme';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

export default function AddFocusBlockScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const isDark = useIsDark();
  const params = useLocalSearchParams<{ id?: string }>();
  const editId = params.id ?? null;
  const isEditing = editId !== null;

  const addFocusBlock = useFocusBlockStore((s) => s.addFocusBlock);
  const updateFocusBlock = useFocusBlockStore((s) => s.updateFocusBlock);
  const deleteFocusBlock = useFocusBlockStore((s) => s.deleteFocusBlock);
  const existing = useFocusBlockStore((s) =>
    editId ? s.focusBlocks.find((item) => item.id === editId) ?? null : null,
  );

  const { state: adminState, isSettled } = useAdminState();
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

  const selection = useBlocklistStore((s) => s.selection);
  const setSelection = useBlocklistStore((s) => s.setActivitySelection);
  const setWebDomains = useBlocklistStore((s) => s.setWebDomains);
  const addWebDomain = useBlocklistStore((s) => s.addWebDomain);
  const removeWebDomain = useBlocklistStore((s) => s.removeWebDomain);

  useEffect(() => {
    if (existing) {
      const blockSelection = existing.selection ?? EMPTY_BLOCK_SELECTION;
      setSelection(blockSelection.activitySelection);
      setWebDomains(blockSelection.webDomains);
    } else {
      setSelection(EMPTY_BLOCK_SELECTION.activitySelection);
      setWebDomains(EMPTY_BLOCK_SELECTION.webDomains);
    }
  }, [existing, setSelection, setWebDomains]);

  const { error, isPending, run } = useAsyncAction();

  useEffect(() => {
    if (isSettled && isAdminLocked) {
      router.back();
    }
  }, [isAdminLocked, isSettled, router]);

  const startTime = useMemo(() => dateToTimeString(startDate), [startDate]);
  const endTime = useMemo(() => dateToTimeString(endDate), [endDate]);

  const applyPreset = (kind: 'work' | 'evening' | 'weekend') => {
    void haptic.select();
    if (kind === 'work') {
      setName('Deep Work');
      setStartDate(timeStringToDate('09:00'));
      setEndDate(timeStringToDate('12:00'));
      setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri']);
      setWebDomains([
        'instagram.com',
        'facebook.com',
        'twitter.com',
        'x.com',
        'tiktok.com',
        'youtube.com',
        'reddit.com',
        'twitch.tv',
        'netflix.com',
        'hulu.com',
      ]);
    } else if (kind === 'evening') {
      setName('Evening Wind-down');
      setStartDate(timeStringToDate('21:00'));
      setEndDate(timeStringToDate('23:30'));
      setSelectedDays(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
      setWebDomains([
        'youtube.com',
        'netflix.com',
        'tiktok.com',
        'twitch.tv',
        'hulu.com',
        'disneyplus.com',
        'primevideo.com',
        'instagram.com',
      ]);
    } else {
      setName('Digital Detox');
      setStartDate(timeStringToDate('08:00'));
      setEndDate(timeStringToDate('20:00'));
      setSelectedDays(['sat', 'sun']);
      setWebDomains([
        'instagram.com',
        'tiktok.com',
        'facebook.com',
        'reddit.com',
        'twitter.com',
        'x.com',
        'youtube.com',
        'twitch.tv',
      ]);
    }
  };

  const toggleDay = (day: DayOfWeek): void => {
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

  const handleAddDomain = async (): Promise<void> => {
    if (!newDomain.trim()) return;
    const success = await run(async () => {
      addWebDomain(newDomain);
      void haptic.select();
    }, 'Invalid domain.');
    if (success) {
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    removeWebDomain(domain);
    void haptic.select();
  };

  const handleSave = async (): Promise<void> => {
    if (!selectionHasBlockedTargets(selection)) {
      void run(async () => {
        throw new Error('Pick at least one app or site to block.');
      }, 'Blocklist is empty.');
      return;
    }

    const input: FocusBlockInput = {
      name,
      startTime,
      endTime,
      days: selectedDays,
      isEnabled: existing?.isEnabled ?? true,
      selection,
    };

    const success = await run(async () => {
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

  const handleSelectionChange = (event: {
    nativeEvent: ActivitySelectionMetadata;
  }): Promise<boolean> =>
    run(async () => {
      void haptic.select();
      setSelection(createActivitySelectionFromMetadata(event.nativeEvent));
    }, 'Could not save selection.');

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

          {!isEditing && (
            <View className="gap-3">
              <Typography variant="label" tone="faint">
                Presets
              </Typography>
              <View className="flex-row gap-2">
                <PresetChip
                  label="Deep Work"
                  onPress={() => applyPreset('work')}
                />
                <PresetChip
                  label="Evening"
                  onPress={() => applyPreset('evening')}
                />
                <PresetChip
                  label="Weekend"
                  onPress={() => applyPreset('weekend')}
                />
              </View>
            </View>
          )}

          <View className="gap-6 bg-surface-raised rounded-3xl p-6 shadow-sm border border-divider/10">
            <View className="gap-3">
              <Typography variant="label" tone="faint">
                Block Name
              </Typography>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Morning Deep Work"
                placeholderTextColor={colors.inkFaint}
                className="text-[22px] font-semibold"
                style={{ color: colors.ink }}
              />
            </View>

            <View className="h-[1px] bg-divider" />

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
                  textColor={colors.ink}
                />
              </View>
            </View>

            <View className="h-[1px] bg-divider" />

            <View className="gap-3">
              <Typography variant="label" tone="faint">
                Repeat
              </Typography>
              <View className="flex-row justify-between">
                {DAYS.map((day) => {
                  const active = selectedDays.includes(day.value);
                  return (
                    <Pressable
                      key={day.value}
                      onPress={() => toggleDay(day.value)}
                      className={`h-10 w-10 items-center justify-center rounded-full ${
                        active ? 'bg-signal' : 'bg-surface-sunken'
                      }`}
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
          </View>

          <View className="gap-4">
            <Typography variant="label" tone="faint">
              Blocking
            </Typography>
            <View className="gap-4">
              <Pressable
                onPress={() => {
                  void haptic.select();
                  setIsPickerVisible(true);
                }}
                className="bg-surface-raised rounded-3xl p-6 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-4">
                  <Icon name="app.badge" size={24} tone="muted" />
                  <View>
                    <Typography variant="body-md" tone="ink">
                      Apps & Categories
                    </Typography>
                    <Typography variant="caption" tone="muted">
                      {selection.activitySelection.status === 'saved'
                        ? `${selection.activitySelection.applicationCount} apps selected`
                        : 'None selected'}
                    </Typography>
                  </View>
                </View>
                <Icon name="chevron.right" size={18} tone="faint" />
              </Pressable>

              <View className="bg-surface-raised rounded-3xl p-6 gap-6 shadow-sm border border-divider/10">
                <View className="flex-row items-center gap-4">
                  <Icon name="globe" size={24} tone="muted" />
                  <Typography variant="body-md" tone="ink" className="flex-1">
                    Blocked Websites
                  </Typography>
                </View>

                <View className="flex-row gap-2">
                  <TextInput
                    placeholder="example.com"
                    placeholderTextColor={colors.inkFaint}
                    value={newDomain}
                    onChangeText={setNewDomain}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    className="flex-1 bg-surface-sunken rounded-xl px-4 py-3"
                    style={{ color: colors.ink }}
                  />
                  <Pressable
                    onPress={() => void handleAddDomain()}
                    className="bg-signal w-12 h-12 items-center justify-center rounded-xl"
                  >
                    <Icon name="plus" size={20} tone="surface" />
                  </Pressable>
                </View>

                {selection.webDomains.length > 0 && (
                  <View className="gap-3">
                    {selection.webDomains.map((domain) => (
                      <View
                        key={domain}
                        className="flex-row justify-between items-center bg-surface-sunken/40 px-5 py-4 rounded-xl border border-divider/5"
                      >
                        <Typography variant="body" tone="ink">
                          {domain}
                        </Typography>
                        <Pressable onPress={() => handleRemoveDomain(domain)}>
                          <Icon
                            name="xmark.circle.fill"
                            size={18}
                            tone="faint"
                          />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {error ? (
            <Typography variant="caption" tone="danger">
              {error}
            </Typography>
          ) : null}

          <View className="gap-3 pt-2 pb-10">
            <Button
              title={isEditing ? 'Save changes' : 'Create block'}
              variant="commit"
              onPress={() => void handleSave()}
              isLoading={isPending}
              disabled={isPending}
            />
            {isEditing && (
              <Button
                title="Delete block"
                variant="abandon"
                onPress={handleDelete}
                disabled={isPending}
              />
            )}
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => router.back()}
              disabled={isPending}
            />
          </View>
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

function PresetChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface-raised px-5 py-3 rounded-full border border-divider/50"
    >
      <Typography variant="body-md" tone="muted">
        {label}
      </Typography>
    </Pressable>
  );
}
