import { useConvexAuth } from 'convex/react';
import { Redirect } from 'expo-router';
import { AuthStartupScreen } from '../src/features/auth/AuthStartupScreen';

export default function IndexRoute(): JSX.Element {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <AuthStartupScreen isLoading />;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
