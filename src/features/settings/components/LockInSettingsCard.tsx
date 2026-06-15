import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import type { AdminState, SetupBlock } from '../adminState';
import { describeLockInCard } from '../lockInCopy';

interface LockInSettingsCardProps {
  readonly now: Date;
  readonly onPress: () => void;
  readonly state: AdminState;
  readonly setupBlock: SetupBlock | null;
}

export function LockInSettingsCard({
  now,
  onPress,
  state,
  setupBlock,
}: LockInSettingsCardProps): JSX.Element {
  const { title, subtitle } = describeLockInCard(state, setupBlock, now);
  const isLocked = state.kind === 'locked';

  return (
    <Card onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon
            name={isLocked ? 'lock.fill' : 'lock.open.fill'}
            size={20}
            tone={isLocked ? 'signal' : 'muted'}
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
