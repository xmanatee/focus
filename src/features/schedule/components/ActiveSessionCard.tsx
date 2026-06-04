import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { formatRelative } from '../../../shared/days';
import type { FocusBlockRuntimeStatus } from '../runtimeStatus';

interface ActiveSessionCardProps {
  readonly status: Extract<FocusBlockRuntimeStatus, { kind: 'active' }>;
  readonly now: Date;
}

export function ActiveSessionCard({
  status,
  now,
}: ActiveSessionCardProps): JSX.Element {
  const { block } = status;

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
        {describeActiveStatus(status, now)}
      </Typography>
    </Card>
  );
}

function describeActiveStatus(
  status: Extract<FocusBlockRuntimeStatus, { kind: 'active' }>,
  now: Date,
): string {
  const relative = formatRelative(status.endsAt, now);
  if (status.reason === 'outsideSchedule') {
    return `Allowed again at ${timeLabel(status.endsAt)} · ${relative}`;
  }
  if (status.reason === 'budget') {
    return `Budget used · resets ${timeLabel(status.endsAt)} · ${relative}`;
  }
  return `Ends at ${timeLabel(status.endsAt)} · ${relative}`;
}

function timeLabel(at: Date): string {
  return `${String(at.getHours()).padStart(2, '0')}:${String(
    at.getMinutes(),
  ).padStart(2, '0')}`;
}
