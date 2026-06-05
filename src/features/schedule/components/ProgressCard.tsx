import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import type { FocusProgress } from '../progress';

interface ProgressCardProps {
  readonly progress: FocusProgress;
}

function metricLabel(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function ProgressCard({
  progress,
}: ProgressCardProps): JSX.Element | null {
  if (progress.enabledBlockCount === 0) return null;

  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <Icon name="chart.bar.fill" size={22} tone="signal" />
        <View className="flex-1 gap-1">
          <Typography variant="h3" tone="ink">
            Focus coverage
          </Typography>
          <Typography variant="body" tone="muted">
            Local summary of the protection you have configured on this device.
          </Typography>
        </View>
      </View>
      <View className="gap-2">
        <ProgressMetric
          label="Enabled"
          value={metricLabel(progress.enabledBlockCount, 'block', 'blocks')}
        />
        <ProgressMetric
          label="Protected"
          value={metricLabel(
            progress.protectedTargetCount,
            'target',
            'targets',
          )}
        />
        <ProgressMetric
          label="This week"
          value={metricLabel(
            progress.completedScheduledWindowCount,
            'window passed',
            'windows passed',
          )}
        />
        <ProgressMetric
          label="Lock-in"
          value={metricLabel(progress.strictBlockCount, 'strict', 'strict')}
        />
      </View>
    </Card>
  );
}

function ProgressMetric({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): JSX.Element {
  return (
    <View className="flex-row items-center justify-between rounded-xl bg-surface-sunken px-3 py-2">
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
      <Typography variant="caption" tone="ink">
        {value}
      </Typography>
    </View>
  );
}
