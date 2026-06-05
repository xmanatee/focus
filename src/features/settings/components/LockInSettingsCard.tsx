import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import type { SetupBlock } from '../adminState';

interface LockInSettingsCardProps {
  readonly isAdminLocked: boolean;
  readonly onPress: () => void;
  readonly setupBlock: SetupBlock | null;
}

export function LockInSettingsCard({
  isAdminLocked,
  onPress,
  setupBlock,
}: LockInSettingsCardProps): JSX.Element {
  const title =
    setupBlock === null
      ? 'Set up Lock-in'
      : isAdminLocked
        ? 'Locked'
        : 'Editable now';
  const subtitle =
    setupBlock === null
      ? 'Set a weekly setup window so you can edit blocks only during it.'
      : isAdminLocked
        ? `Editable next during your setup block (${setupBlock.startTime}–${setupBlock.endTime}).`
        : 'You are inside your setup window — edits are allowed.';

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon
            name={isAdminLocked ? 'lock.fill' : 'lock.open.fill'}
            size={20}
            tone={isAdminLocked ? 'signal' : 'muted'}
          />
          <Typography variant="h3" tone="ink">
            {title}
          </Typography>
        </View>
        <Icon name="chevron.right" size={16} tone="faint" />
      </View>
      <Typography variant="body" tone="muted">
        {subtitle}
      </Typography>
    </Card>
  );
}
