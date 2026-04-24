import { useConvexAuth } from 'convex/react';
import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { AuthStartupScreen } from './AuthStartupScreen';

interface RequireAuthProps {
  readonly children: ReactNode;
}

export function RequireAuth({
  children,
}: RequireAuthProps): JSX.Element | null {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <AuthStartupScreen isLoading />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}
