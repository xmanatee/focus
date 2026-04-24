import { useAuthActions } from '@convex-dev/auth/react';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Button } from '../src/shared/components/Button';
import { Typography } from '../src/shared/components/Typography';

type OAuthProvider = 'apple' | 'google';
type PendingProvider = OAuthProvider | 'callback';

export default function LoginScreen() {
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

  const handleSignIn = async (provider: OAuthProvider) => {
    lastInvokedProvider.current = provider;
    setPendingProvider(provider);
    setErrorMessage(null);
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
    <View className="flex-1 bg-background px-8 justify-center">
      <View className="mb-12 items-center">
        <Typography variant="h1">Fucus.</Typography>
        <Typography
          variant="body"
          align="center"
          className="mt-2 text-textMuted"
        >
          Sign in to sync your focus schedules across all your devices.
        </Typography>
      </View>

      <View className="gap-4">
        <Button
          title="Continue with Apple"
          onPress={() => void handleSignIn('apple')}
          isLoading={pendingProvider === 'apple'}
          disabled={pendingProvider !== null}
        />

        <Button
          title="Continue with Google"
          variant="secondary"
          onPress={() => void handleSignIn('google')}
          isLoading={pendingProvider === 'google'}
          disabled={pendingProvider !== null}
        />

        {errorMessage ? (
          <Typography variant="caption" align="center" className="text-red-600">
            {errorMessage}
          </Typography>
        ) : pendingProvider === 'callback' ? (
          <Typography
            variant="caption"
            align="center"
            className="text-textMuted"
          >
            Finishing sign-in...
          </Typography>
        ) : null}

        <View className="mt-8">
          <Typography variant="caption" align="center">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </View>
      </View>
    </View>
  );
}
