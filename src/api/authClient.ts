import { expoClient } from '@better-auth/expo/client';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

const siteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;

if (!siteUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_SITE_URL.');
}

export const authClient = createAuthClient({
  baseURL: siteUrl,
  plugins: [
    expoClient({
      scheme: 'fucus',
      storagePrefix: 'fucus',
      storage: SecureStore,
    }),
    convexClient(),
  ],
});
