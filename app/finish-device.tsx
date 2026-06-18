import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { summarizeActivitySelection } from '../src/features/blocker/types';
import { focusBlockNeedsLocalSelection } from '../src/features/schedule/localActivitySelection';
import type { FocusBlock } from '../src/features/schedule/types';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { Button } from '../src/shared/components/Button';
import { Card } from '../src/shared/components/Card';
import { Icon } from '../src/shared/components/Icon';
import { Screen } from '../src/shared/components/Screen';
import { Section } from '../src/shared/components/Section';
import { Typography } from '../src/shared/components/Typography';
import { useDismiss } from '../src/shared/hooks/useDismiss';

function DeviceBlockRow({
  block,
  needsSelection,
  onPress,
}: {
  readonly block: FocusBlock;
  readonly needsSelection: boolean;
  readonly onPress: () => void;
}): JSX.Element {
  return (
    <Card onPress={onPress}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography variant="body-md" tone="ink">
            {block.name}
          </Typography>
          <Typography variant="caption" tone="muted">
            {summarizeActivitySelection(block.selection.activitySelection)}
          </Typography>
        </View>
        <View className="flex-row items-center gap-2">
          <Icon
            name={
              needsSelection
                ? 'exclamationmark.triangle.fill'
                : 'checkmark.seal.fill'
            }
            size={16}
            tone={needsSelection ? 'signal' : 'muted'}
          />
          <Typography
            variant="caption"
            tone={needsSelection ? 'signal' : 'muted'}
          >
            {needsSelection ? 'Needs apps here' : 'Ready'}
          </Typography>
        </View>
      </View>
    </Card>
  );
}

export default function FinishDeviceScreen(): JSX.Element {
  const router = useRouter();
  const dismiss = useDismiss();
  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const missingBlocks = focusBlocks.filter(focusBlockNeedsLocalSelection);

  const editBlock = (block: FocusBlock): void => {
    router.push({
      pathname: '/add-focus-block',
      params: { id: block.id },
    });
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
            Finish this device.
          </Typography>
          <Typography variant="body" tone="muted">
            Rules sync with iCloud, but iOS keeps app selections private to each
            iPhone and iPad. Pick apps once on this device before those app
            blocks can apply here.
          </Typography>
        </View>

        {missingBlocks.length === 0 ? (
          <Card>
            <View className="flex-row items-center gap-3">
              <Icon name="checkmark.seal.fill" size={22} tone="signal" />
              <View className="flex-1 gap-1">
                <Typography variant="h3" tone="ink">
                  This device is ready
                </Typography>
                <Typography variant="body" tone="muted">
                  Every synced block has the local selection data it needs
                  before you turn it on here.
                </Typography>
              </View>
            </View>
            <Button title="Done" variant="commit" onPress={dismiss} />
          </Card>
        ) : (
          <Section title="Needs App Selection">
            {missingBlocks.map((block) => (
              <DeviceBlockRow
                key={block.id}
                block={block}
                needsSelection
                onPress={() => editBlock(block)}
              />
            ))}
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}
