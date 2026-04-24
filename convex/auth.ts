import { expo } from '@better-auth/expo';
import { type GenericCtx, createClient } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { betterAuth } from 'better-auth';
import { components } from './_generated/api';
import type { DataModel } from './_generated/dataModel';
import authConfig from './auth.config';

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) =>
  betterAuth({
    trustedOrigins: ['fucus://', 'https://appleid.apple.com'],
    database: authComponent.adapter(ctx),
    socialProviders: {
      apple: {
        // eslint-disable-next-line n/no-process-env
        clientId: process.env.APPLE_CLIENT_ID ?? '',
        // eslint-disable-next-line n/no-process-env
        clientSecret: process.env.APPLE_CLIENT_SECRET ?? '',
        appBundleIdentifier: 'com.yourbound.fucus',
      },
      google: {
        clientId: [
          // eslint-disable-next-line n/no-process-env
          process.env.GOOGLE_IOS_CLIENT_ID ?? '',
          // eslint-disable-next-line n/no-process-env
          process.env.GOOGLE_WEB_CLIENT_ID ?? '',
        ],
        // eslint-disable-next-line n/no-process-env
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET ?? '',
      },
    },
    plugins: [expo(), convex({ authConfig })],
  });
