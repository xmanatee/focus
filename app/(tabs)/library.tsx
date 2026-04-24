import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
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
  const selection = useBlockerStore((s) => s.selection);
  const addWebDomain = useBlockerStore((s) => s.addWebDomain);
  const removeWebDomain = useBlockerStore((s) => s.removeWebDomain);

  const [segment, setSegment] = useState<Segment>('apps');
  const [newDomain, setNewDomain] = useState('');
  const { error, run } = useAsyncAction();

  const handleAdd = async (): Promise<void> => {
    const success = await run(
      () => addWebDomain(newDomain),
      'Could not add site.',
    );
    if (success) {
      void haptic.select();
      setNewDomain('');
    }
  };

  const handleRemove = (domain: string): Promise<boolean> => {
    void haptic.select();
    return run(() => removeWebDomain(domain), 'Could not remove site.');
  };

  const pickedSummary =
    selection.activitySelection.status === 'saved'
      ? `${selection.activitySelection.applicationCount} apps · ${selection.activitySelection.categoryCount} categories · ${selection.activitySelection.webDomainCount} Apple picks`
      : 'No selection saved.';

  return (
    <Screen>
      <View className="pt-4 pb-6">
        <Typography variant="label" tone="muted">
          Library
        </Typography>
        <Typography variant="display-md" tone="ink">
          What to block.
        </Typography>
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
            {pickedSummary}
          </Typography>
          <Button
            title="Open Apple picker"
            variant="ghost"
            onPress={() => router.push('/select-apps')}
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
              className="flex-1 bg-surface-raised rounded-full px-5 py-3 text-[16px]"
              style={{ color: colors.ink }}
            />
            <Pressable
              onPress={() => void handleAdd()}
              className="bg-signal rounded-full h-12 w-12 items-center justify-center"
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
            <View className="py-8">
              <Typography variant="body" tone="muted" align="center">
                No sites blocked. Add one above.
              </Typography>
            </View>
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
                    onPress={() => void handleRemove(domain)}
                    hitSlop={12}
                    accessibilityLabel={`Remove ${domain}`}
                  >
                    <Icon name="minus.circle" size={22} tone="muted" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
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
