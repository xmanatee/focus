import { View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';

interface ScreenTimeAccessCardProps {
  readonly denied: boolean;
  readonly isAuthorizing: boolean;
  readonly onGrant: () => void;
  readonly onOpenSettings: () => void;
}

export function ScreenTimeAccessCard({
  denied,
  isAuthorizing,
  onGrant,
  onOpenSettings,
}: ScreenTimeAccessCardProps): JSX.Element {
  return (
    <Card tone="signal">
      <View className="flex-row items-center gap-2">
        <Icon name="lock.shield.fill" size={24} tone="signal" />
        <Typography variant="h3" tone="signal">
          {denied ? 'Permission denied' : 'Grant access'}
        </Typography>
      </View>
      <Typography variant="body" tone="ink">
        {denied
          ? "Open iOS Settings → Screen Time → Family Controls and allow Focus Blocks. iOS won't show the prompt again from inside the app."
          : 'Focus Blocks needs Screen Time permissions to block distracting apps.'}
      </Typography>
      <Button
        title={denied ? 'Open Settings' : 'Give access'}
        variant="commit"
        onPress={denied ? onOpenSettings : onGrant}
        isLoading={!denied && isAuthorizing}
        disabled={!denied && isAuthorizing}
      />
    </Card>
  );
}
