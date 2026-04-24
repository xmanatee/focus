import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { selectionHasBlockedTargets } from '../../src/features/blocker/types';
import { useBlocklistStore } from '../../src/features/blocker/useBlocklistStore';
import { useActiveSchedule } from '../../src/features/schedule/useActiveSchedule';
import { useScheduleStore } from '../../src/features/schedule/useScheduleStore';
import { useAdminState } from '../../src/features/settings/useAdminState';
import { Button } from '../../src/shared/components/Button';
import { Icon } from '../../src/shared/components/Icon';
import { Screen } from '../../src/shared/components/Screen';
import { Typography } from '../../src/shared/components/Typography';
import { haptic } from '../../src/shared/design/haptics';
import { useThemeColors } from '../../src/shared/design/theme';
import { useAsyncAction } from '../../src/shared/hooks/useAsyncAction';

type Segment = 'apps' | 'sites';

export default function LibraryScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const selection = useBlocklistStore((s) => s.selection);
  const addWebDomain = useBlocklistStore((s) => s.addWebDomain);
  const removeWebDomain = useBlocklistStore((s) => s.removeWebDomain);
  const schedules = useScheduleStore((s) => s.schedules);

  const { active } = useActiveSchedule(schedules);
  const { state: adminState } = useAdminState();

  const [segment, setSegment] = useState<Segment>('apps');
  const [newDomain, setNewDomain] = useState('');
  const { error, run } = useAsyncAction();

  const isAdminLocked = adminState.kind === 'locked';
  const isLocked = active !== null || isAdminLocked;
  const lockReason =
    active !== null
      ? 'End the active schedule to edit.'
      : isAdminLocked
        ? 'Outside setup hours. Open Settings.'
        : null;

  const handleAddDomain = async (): Promise<void> => {
    const ok = await run(async () => {
      addWebDomain(newDomain);
    }, 'Could not add site.');
    if (ok) {
      void haptic.select();
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string): Promise<boolean> =>
    run(async () => {
      void haptic.select();
      removeWebDomain(domain);
    }, 'Could not remove site.');

  const hasTargets = selectionHasBlockedTargets(selection);

  const appsSummary =
    selection.activitySelection.status === 'saved'
      ? `${selection.activitySelection.applicationCount} apps · ${selection.activitySelection.categoryCount} categories`
      : 'No apps picked.';

  return (
    <Screen>
      <View className="pt-4 pb-6">
        <Typography variant="label" tone="muted">
          {isLocked ? 'Locked' : 'Blocklist'}
        </Typography>
        <Typography variant="display-md" tone="ink">
          What to block.
        </Typography>
        {lockReason ? (
          <Typography variant="caption" tone="faint" className="mt-1">
            {lockReason}
          </Typography>
        ) : null}
      </View>

      <View className="flex-row bg-surface-sunken rounded-full p-1 mb-6">
        <SegmentButton
          label="Apps"
          active={segment === 'apps'}
          onPress={() => {
            void haptic.select();
            setSegment('apps');
          }}
        />
        <SegmentButton
          label="Sites"
          active={segment === 'sites'}
          onPress={() => {
            void haptic.select();
            setSegment('sites');
          }}
        />
      </View>

      {segment === 'apps' ? (
        <View className="gap-6">
          <Typography variant="body" tone="muted">
            {appsSummary}
          </Typography>
          <Button
            title="Open Apple picker"
            variant="ghost"
            onPress={() => router.push('/select-apps')}
            disabled={isLocked}
          />
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-row gap-2 mb-6">
            <TextInput
              placeholder="example.com"
              placeholderTextColor={colors.inkFaint}
              value={newDomain}
              onChangeText={setNewDomain}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!isLocked}
              className="flex-1 bg-surface-raised rounded-full px-5 py-3 text-[16px]"
              style={{ color: colors.ink }}
            />
            <Pressable
              onPress={() => void handleAddDomain()}
              disabled={isLocked}
              className={`bg-signal rounded-full h-12 w-12 items-center justify-center ${
                isLocked ? 'opacity-40' : ''
              }`}
              accessibilityLabel="Add site"
            >
              <Icon name="plus" size={20} tone="surface" />
            </Pressable>
          </View>

          {error ? (
            <Typography variant="caption" tone="danger" className="mb-4">
              {error}
            </Typography>
          ) : null}

          {selection.webDomains.length === 0 ? (
            <Typography
              variant="body"
              tone="muted"
              align="center"
              className="mt-8"
            >
              No sites blocked. Add one above.
            </Typography>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {selection.webDomains.map((domain, index) => (
                <View
                  key={domain}
                  className={`flex-row justify-between items-center py-4 ${
                    index !== selection.webDomains.length - 1
                      ? 'border-b border-divider'
                      : ''
                  }`}
                >
                  <Typography variant="body-md" tone="ink">
                    {domain}
                  </Typography>
                  <Pressable
                    onPress={() => void handleRemoveDomain(domain)}
                    disabled={isLocked}
                    hitSlop={12}
                    accessibilityLabel={`Remove ${domain}`}
                  >
                    <Icon
                      name="minus.circle"
                      size={22}
                      tone={isLocked ? 'faint' : 'muted'}
                    />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {!hasTargets ? (
        <Typography
          variant="caption"
          tone="faint"
          align="center"
          className="mt-6"
        >
          Pick apps or add sites before creating schedules.
        </Typography>
      ) : null}
    </Screen>
  );
}

interface SegmentButtonProps {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}

function SegmentButton({
  label,
  active,
  onPress,
}: SegmentButtonProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-2 rounded-full ${
        active ? 'bg-surface-raised' : ''
      }`}
    >
      <Typography
        variant="body-md"
        tone={active ? 'ink' : 'muted'}
        align="center"
      >
        {label}
      </Typography>
    </Pressable>
  );
}
