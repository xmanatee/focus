import { useRouter } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { BlockerBridge } from '../src/bridge/BlockerBridge';
import type { RuntimeAccessKind } from '../src/bridge/BlockerBridge.types';
import { summarizeActivitySelection } from '../src/features/blocker/types';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useSetupActionHandler } from '../src/features/diagnostics/useSetupActionHandler';
import { focusBlockNeedsLocalSelection } from '../src/features/schedule/localActivitySelection';
import { missingRuntimeAccess } from '../src/features/schedule/runtimeAccess';
import type { FocusBlock } from '../src/features/schedule/types';
import { useBlockActivationStore } from '../src/features/schedule/useBlockActivationStore';
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
  missingAccess,
  onPress,
}: {
  readonly block: FocusBlock;
  readonly needsSelection: boolean;
  readonly missingAccess: readonly RuntimeAccessKind[];
  readonly onPress: () => void;
}): React.JSX.Element {
  const needsAction = needsSelection || missingAccess.length > 0;
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
              needsAction
                ? 'exclamationmark.triangle.fill'
                : 'checkmark.seal.fill'
            }
            size={16}
            tone={needsAction ? 'signal' : 'muted'}
          />
          <Typography variant="caption" tone={needsAction ? 'signal' : 'muted'}>
            {needsSelection
              ? 'Needs apps here'
              : missingAccess.length > 0
                ? 'Needs access'
                : 'Ready'}
          </Typography>
        </View>
      </View>
      {missingAccess.length > 0 ? (
        <Typography variant="caption" tone="signal">
          {missingAccess.includes('dailyBudgets')
            ? 'Allow Usage Access for budget measurement.'
            : 'Allow the local VPN for website blocking.'}
        </Typography>
      ) : null}
    </Card>
  );
}

export default function FinishDeviceScreen(): React.JSX.Element {
  const router = useRouter();
  const dismiss = useDismiss();
  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const runtimeAccess = useBlockerStore((s) => s.access.runtimeAccess);
  const handleSetupAction = useSetupActionHandler();
  const enabledBlockIds = useBlockActivationStore((s) => s.enabledBlockIds);
  const unfinishedBlocks = focusBlocks.filter(
    (block) =>
      enabledBlockIds.includes(block.id) &&
      (focusBlockNeedsLocalSelection(block) ||
        missingRuntimeAccess(block, runtimeAccess).length > 0),
  );

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
            {BlockerBridge.capabilities.finishDeviceBody}
          </Typography>
        </View>

        {unfinishedBlocks.length === 0 ? (
          <Card>
            <View className="flex-row items-center gap-3">
              <Icon name="checkmark.seal.fill" size={22} tone="signal" />
              <View className="flex-1 gap-1">
                <Typography variant="h3" tone="ink">
                  This device is ready
                </Typography>
                <Typography variant="body" tone="muted">
                  Every enabled block has local app selection data and uses the
                  required access on this device.
                </Typography>
              </View>
            </View>
            <Button title="Done" variant="commit" onPress={dismiss} />
          </Card>
        ) : (
          <Section title="Needs Attention">
            {unfinishedBlocks.map((block) => (
              <DeviceBlockRow
                key={block.id}
                block={block}
                needsSelection={focusBlockNeedsLocalSelection(block)}
                missingAccess={missingRuntimeAccess(block, runtimeAccess)}
                onPress={() => {
                  if (focusBlockNeedsLocalSelection(block)) {
                    editBlock(block);
                    return;
                  }
                  const missing = missingRuntimeAccess(block, runtimeAccess);
                  handleSetupAction(
                    missing[0] === 'dailyBudgets'
                      ? 'requestDailyBudgetAccess'
                      : 'requestWebsiteBlockingAccess',
                  );
                }}
              />
            ))}
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}
