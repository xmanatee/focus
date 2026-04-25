import { View } from 'react-native';
import { NotifyRow } from '../../../shared/components/NotifyRow';
import { Typography } from '../../../shared/components/Typography';

interface NotificationsCardProps {
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly onChangeStart: (next: boolean) => void;
  readonly onChangeEnd: (next: boolean) => void;
}

export function NotificationsCard({
  notifyOnStart,
  notifyOnEnd,
  onChangeStart,
  onChangeEnd,
}: NotificationsCardProps): JSX.Element {
  return (
    <View className="gap-3">
      <Typography variant="label" tone="faint">
        Notifications
      </Typography>
      <View className="bg-surface-raised rounded-3xl p-card gap-3 shadow-sm border border-divider/10">
        <NotifyRow
          title="Start Notification"
          subtitle="Alert when this block begins."
          value={notifyOnStart}
          onChange={onChangeStart}
        />
        <View className="h-[1px] bg-divider/10" />
        <NotifyRow
          title="End Notification"
          subtitle="Alert when this block finishes."
          value={notifyOnEnd}
          onChange={onChangeEnd}
        />
      </View>
    </View>
  );
}
