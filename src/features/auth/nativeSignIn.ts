import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { authClient } from '../../api/authClient';

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

GoogleSignin.configure({
  iosClientId: googleIosClientId,
  scopes: ['openid', 'email', 'profile'],
});

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function generateRawNonce(): string {
  return toHex(Crypto.getRandomBytes(16));
}

export async function signInWithApple(): Promise<void> {
  const rawNonce = generateRawNonce();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token.');
  }

  await authClient.signIn.social({
    provider: 'apple',
    idToken: {
      token: credential.identityToken,
      nonce: rawNonce,
    },
  });
}

export async function signInWithGoogle(): Promise<void> {
  if (!googleIosClientId) {
    throw new Error('Missing EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.');
  }
  await GoogleSignin.hasPlayServices();
  const result = await GoogleSignin.signIn();
  if (result.type !== 'success') {
    if (result.type === 'cancelled') {
      return;
    }
    throw new Error('Google sign-in did not complete.');
  }
  const idToken = result.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return an ID token.');
  }

  await authClient.signIn.social({
    provider: 'google',
    idToken: { token: idToken },
  });
}
