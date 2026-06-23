import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';

interface SchedulerErrorCardProps {
  readonly message: string;
}

export function SchedulerErrorCard({
  message,
}: SchedulerErrorCardProps): JSX.Element {
  return (
    <Card>
      <View className="flex-row items-start gap-3">
        <Icon name="exclamationmark.triangle.fill" size={22} tone="signal" />
        <View className="flex-1 gap-1">
          <Typography variant="h3" tone="ink">
            Focus Blocks not applied
          </Typography>
          <Typography variant="body" tone="muted">
            {message}
          </Typography>
        </View>
      </View>
    </Card>
  );
}
