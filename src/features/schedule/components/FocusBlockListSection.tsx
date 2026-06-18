import { Pressable, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Section } from '../../../shared/components/Section';
import { Typography } from '../../../shared/components/Typography';
import { focusBlockNeedsLocalSelection } from '../localActivitySelection';
import { focusBlockRunnableLocally } from '../localRuntime';
import { getFocusBlockRuntimeStatus } from '../runtimeStatus';
import type { FocusBlock } from '../types';
import { FocusBlockRow } from './FocusBlockRow';

interface FocusBlockListSectionProps {
  readonly enabledBlockIds: readonly string[];
  readonly focusBlocks: readonly FocusBlock[];
  readonly isAdminLocked: boolean;
  readonly now: Date;
  readonly onAdd: () => void;
  readonly onEdit: (blockId: string) => void;
  readonly onToggle: (blockId: string, nextIsEnabled: boolean) => void;
}

export function FocusBlockListSection({
  enabledBlockIds,
  focusBlocks,
  isAdminLocked,
  now,
  onAdd,
  onEdit,
  onToggle,
}: FocusBlockListSectionProps): JSX.Element {
  return (
    <Section
      title="Focus Blocks"
      action={
        <Pressable
          onPress={onAdd}
          accessibilityLabel="Add focus block"
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-full bg-signal"
        >
          <Icon name="plus" size={20} tone="surface" />
        </Pressable>
      }
    >
      {focusBlocks.length === 0 ? (
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
        focusBlocks.map((block) => {
          const isEnabled = enabledBlockIds.includes(block.id);
          const runnableBlock = focusBlockRunnableLocally(block, isEnabled);
          const status = getFocusBlockRuntimeStatus(runnableBlock, now);
          const isActive = status.kind === 'active';
          const needsDeviceSelection = focusBlockNeedsLocalSelection(block);
          return (
            <FocusBlockRow
              key={block.id}
              block={block}
              isEnabled={isEnabled}
              isActive={isActive}
              needsDeviceSelection={needsDeviceSelection}
              toggleDisabled={
                isActive ||
                (isAdminLocked && runnableBlock.isEnabled) ||
                (!isEnabled && needsDeviceSelection)
              }
              onPress={() => onEdit(block.id)}
              onToggle={(next) => onToggle(block.id, next)}
            />
          );
        })
      )}
    </Section>
  );
}
