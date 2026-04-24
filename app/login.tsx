import { Redirect } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { authClient } from '../src/api/authClient';
import { AuthStartupScreen } from '../src/features/auth/AuthStartupScreen';
import {
  signInWithApple,
  signInWithGoogle,
} from '../src/features/auth/nativeSignIn';
import { Button } from '../src/shared/components/Button';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

type Provider = 'apple' | 'google';

export default function LoginScreen(): JSX.Element {
  const { data: session, isPending } = authClient.useSession();
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const { error, run } = useAsyncAction();

  const handleSignIn = (provider: Provider): Promise<boolean> => {
    setPendingProvider(provider);
    void haptic.commit();
    return run(
      () => (provider === 'apple' ? signInWithApple() : signInWithGoogle()),
      provider === 'apple' ? 'Apple sign-in failed.' : 'Google sign-in failed.',
    ).finally(() => setPendingProvider(null));
  };

  if (isPending) {
    return <AuthStartupScreen isLoading />;
  }

  if (session?.user) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen>
      <View className="flex-1 justify-between py-8">
        <Typography variant="label" tone="signal">
          Fucus
        </Typography>

        <View className="gap-3">
          <Typography variant="display-lg" tone="ink">
            Reclaim
          </Typography>
          <Typography variant="display-lg" tone="ink">
            the hour.
          </Typography>
          <Typography
            variant="body"
            tone="muted"
            className="mt-4 max-w-[320px]"
          >
            Block what pulls you in. Pick a window. Come back to yourself.
          </Typography>
        </View>

        <View className="gap-3">
          <Button
            title="Continue with Apple"
            variant="primary"
            onPress={() => void handleSignIn('apple')}
            isLoading={pendingProvider === 'apple'}
            disabled={pendingProvider !== null}
          />
          <Button
            title="Continue with Google"
            variant="ghost"
            onPress={() => void handleSignIn('google')}
            isLoading={pendingProvider === 'google'}
            disabled={pendingProvider !== null}
          />

          {error ? (
            <Typography variant="caption" tone="danger" align="center">
              {error}
            </Typography>
          ) : null}

          <Typography
            variant="caption"
            tone="faint"
            align="center"
            className="mt-4"
          >
            By continuing, you accept the Terms and Privacy Policy.
          </Typography>
        </View>
      </View>
    </Screen>
  );
}
