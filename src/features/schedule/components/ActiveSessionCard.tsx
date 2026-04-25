import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { formatRelative, nextOccurrenceOf } from '../../../shared/days';
import type { FocusBlock } from '../types';

interface ActiveSessionCardProps {
  readonly block: FocusBlock;
  readonly now: Date;
}

export function ActiveSessionCard({
  block,
  now,
}: ActiveSessionCardProps): JSX.Element {
  return (
    <Card tone="ink">
      <View className="flex-row items-center justify-between">
        <Typography variant="label" tone="surface" className="opacity-70">
          Active Session
        </Typography>
        {block.strict && (
          <View className="flex-row items-center gap-1 bg-surface/10 rounded-md px-2 py-0.5">
            <Icon name="lock.fill" size={10} tone="surface" />
            <Typography variant="caption" tone="surface">
              Strict
            </Typography>
          </View>
        )}
      </View>

      <Typography variant="display-md" tone="surface">
        {block.name}
      </Typography>
      <Typography variant="body" tone="surface" className="opacity-70">
        Ends at {block.endTime} ·{' '}
        {formatRelative(nextOccurrenceOf(block.endTime, now), now)}
      </Typography>
    </Card>
  );
}
