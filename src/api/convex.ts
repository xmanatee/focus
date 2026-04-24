import { ConvexReactClient } from 'convex/react';
import { convexLogger } from '../features/diagnostics/runtimeLogs';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL.');
}

export const convex = new ConvexReactClient(convexUrl, {
  logger: convexLogger,
  verbose: true,
});
