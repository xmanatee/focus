import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { NotifyRow } from '../../../shared/components/NotifyRow';
import { Section } from '../../../shared/components/Section';

interface NotificationsCardProps {
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly onChangeStart: (next: boolean) => void;
  readonly onChangeEnd: (next: boolean) => void;
  readonly disabled?: boolean;
}

export function NotificationsCard({
  notifyOnStart,
  notifyOnEnd,
  onChangeStart,
  onChangeEnd,
  disabled = false,
}: NotificationsCardProps): JSX.Element {
  return (
    <Section title="Notifications">
      <Card>
        <NotifyRow
          title="Start Notification"
          subtitle="Alert when this block begins."
          value={notifyOnStart}
          onChange={onChangeStart}
          disabled={disabled}
        />
        <View className="h-[1px] bg-divider/10" />
        <NotifyRow
          title="End Notification"
          subtitle="Alert when this block finishes."
          value={notifyOnEnd}
          onChange={onChangeEnd}
          disabled={disabled}
        />
      </Card>
    </Section>
  );
}
