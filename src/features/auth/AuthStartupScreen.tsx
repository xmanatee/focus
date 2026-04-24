import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { authClient } from '../../api/authClient';
import { Button } from '../../shared/components/Button';
import { Screen } from '../../shared/components/Screen';
import { Typography } from '../../shared/components/Typography';
import { haptic } from '../../shared/design/haptics';
import { useThemeColors } from '../../shared/design/theme';

interface AuthStartupScreenProps {
  readonly isLoading: boolean;
}

export function AuthStartupScreen({
  isLoading,
}: AuthStartupScreenProps): JSX.Element {
  const colors = useThemeColors();
  const [isAuthStalled, setIsAuthStalled] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsAuthStalled(false);
      return;
    }
    const timeout = setTimeout(() => setIsAuthStalled(true), 4000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (isAuthStalled) {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-5">
          <Typography variant="label" tone="danger">
            Startup stalled
          </Typography>
          <Typography variant="display-md" tone="ink">
            Session check is taking too long.
          </Typography>
          <Typography variant="body" tone="muted" className="max-w-[340px]">
            Fucus is waiting for its auth handshake to finish. Clear the local
            session if this device has stale credentials.
          </Typography>
          <View className="mt-4">
            <Button
              title="Clear session"
              variant="abandon"
              onPress={() => {
                void haptic.abandon();
                void authClient.signOut();
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-4">
        <ActivityIndicator size="small" color={colors.signal} />
        <Typography variant="body" tone="muted">
          Checking your session...
        </Typography>
      </View>
    </Screen>
  );
}
