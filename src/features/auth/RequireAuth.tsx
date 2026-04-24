import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { authClient } from '../../api/authClient';
import { AuthStartupScreen } from './AuthStartupScreen';

interface RequireAuthProps {
  readonly children: ReactNode;
}

export function RequireAuth({
  children,
}: RequireAuthProps): JSX.Element | null {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthStartupScreen isLoading />;
  }

  if (!session?.user) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}
