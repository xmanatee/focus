import { useAuthActions } from '@convex-dev/auth/react';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button } from '../src/shared/components/Button';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';

type OAuthProvider = 'apple' | 'google';
type PendingProvider = OAuthProvider | 'callback';

export default function LoginScreen(): JSX.Element {
  const { signIn } = useAuthActions();
  const [pendingProvider, setPendingProvider] =
    useState<PendingProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const url = Linking.useURL();
  const lastInvokedProvider = useRef<OAuthProvider | null>(null);
  const lastHandledCode = useRef<string | null>(null);

  useEffect(() => {
    if (!url) {
      return;
    }

    const codeValue = Linking.parse(url).queryParams?.code;
    const code = Array.isArray(codeValue) ? codeValue[0] : codeValue;

    if (typeof code !== 'string' || code.length === 0) {
      return;
    }

    if (lastHandledCode.current === code) {
      return;
    }

    const provider = lastInvokedProvider.current;
    if (provider === null) {
      return;
    }

    lastHandledCode.current = code;

    void (async () => {
      setPendingProvider('callback');
      setErrorMessage(null);
      try {
        await signIn(provider, { code });
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Could not finish sign-in.',
        );
      } finally {
        setPendingProvider(null);
      }
    })();
  }, [signIn, url]);

  const handleSignIn = async (provider: OAuthProvider): Promise<void> => {
    lastInvokedProvider.current = provider;
    setPendingProvider(provider);
    setErrorMessage(null);
    void haptic.commit();
    try {
      const result = await signIn(provider);
      if (result.redirect) {
        await Linking.openURL(result.redirect.toString());
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Sign-in failed.',
      );
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-between py-8">
        <View>
          <Typography variant="label" tone="signal">
            Fucus
          </Typography>
        </View>

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
            A verdict against distraction. Pick what blocks, pick the window,
            and commit.
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

          {errorMessage ? (
            <Typography
              variant="caption"
              tone="danger"
              align="center"
              className="mt-1"
            >
              {errorMessage}
            </Typography>
          ) : pendingProvider === 'callback' ? (
            <Typography
              variant="caption"
              tone="muted"
              align="center"
              className="mt-1"
            >
              Finishing sign-in...
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
