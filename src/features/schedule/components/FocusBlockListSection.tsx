import { Pressable, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Section } from '../../../shared/components/Section';
import { Typography } from '../../../shared/components/Typography';
import { focusBlockIsEnabledOnDevice } from '../deviceActivation';
import { focusBlockRunnableOnDevice } from '../deviceRuntime';
import { focusBlockNeedsLocalSelection } from '../localActivitySelection';
import { getFocusBlockRuntimeStatus } from '../runtimeStatus';
import type { FocusBlock } from '../types';
import { FocusBlockRow } from './FocusBlockRow';

interface FocusBlockListSectionProps {
  readonly applicableBlocks: readonly FocusBlock[];
  readonly deviceId: string | null;
  readonly isAdminLocked: boolean;
  readonly missingDeviceSelectionCount: number;
  readonly now: Date;
  readonly onAdd: () => void;
  readonly onEdit: (blockId: string) => void;
  readonly onFinishDeviceSetup: () => void;
  readonly onToggle: (blockId: string, nextIsEnabled: boolean) => void;
}

export function FocusBlockListSection({
  applicableBlocks,
  deviceId,
  isAdminLocked,
  missingDeviceSelectionCount,
  now,
  onAdd,
  onEdit,
  onFinishDeviceSetup,
  onToggle,
}: FocusBlockListSectionProps): JSX.Element {
  return (
    <Section
      title="Focus Blocks"
      action={
        <Pressable
          onPress={onAdd}
          className="h-10 w-10 items-center justify-center rounded-full bg-signal"
        >
          <Icon name="plus" size={20} tone="surface" />
        </Pressable>
      }
    >
      {applicableBlocks.length === 0 ? (
        <Card tone="dashed" className="py-10 items-center">
          <Icon name="sparkles" size={24} tone="signal" />
          <Typography variant="h3" tone="ink" align="center">
            Start with a template.
          </Typography>
          <Typography variant="body" tone="muted" align="center">
            Deep Work, Study Focus, Social Budget, and YouTube Limit are ready
            on the next screen.
          </Typography>
          <Button title="Add a block" variant="commit" onPress={onAdd} />
        </Card>
      ) : (
        <>
          {missingDeviceSelectionCount > 0 && (
            <DeviceSelectionNoticeCard onPress={onFinishDeviceSetup} />
          )}
          {applicableBlocks.map((block) => {
            const runnableBlock = focusBlockRunnableOnDevice(block, deviceId);
            const status = getFocusBlockRuntimeStatus(runnableBlock, now);
            const isActive = status.kind === 'active';
            const needsDeviceSelection = focusBlockNeedsLocalSelection(block);
            const isEnabledOnDevice = focusBlockIsEnabledOnDevice(
              block,
              deviceId,
            );
            return (
              <FocusBlockRow
                key={block.id}
                block={block}
                isEnabled={isEnabledOnDevice}
                isActive={isActive}
                needsDeviceSelection={needsDeviceSelection}
                toggleDisabled={
                  isActive ||
                  isAdminLocked ||
                  (!isEnabledOnDevice && needsDeviceSelection)
                }
                onPress={() => onEdit(block.id)}
                onToggle={(next) => onToggle(block.id, next)}
              />
            );
          })}
        </>
      )}
    </Section>
  );
}

function DeviceSelectionNoticeCard({
  onPress,
}: {
  readonly onPress: () => void;
}): JSX.Element {
  return (
    <Card tone="signal">
      <View className="flex-row items-center gap-2">
        <Icon
          name="iphone.gen3.radiowaves.left.and.right"
          size={22}
          tone="signal"
        />
        <Typography variant="h3" tone="signal">
          Confirm apps on this device
        </Typography>
      </View>
      <Typography variant="body" tone="ink">
        iCloud synced the rules, but iOS app selections are private to each
        device. Open each block marked "Pick apps here" and choose the apps for
        this iPhone.
      </Typography>
      <Button title="Finish this device" variant="commit" onPress={onPress} />
    </Card>
  );
}
