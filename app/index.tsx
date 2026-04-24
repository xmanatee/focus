import { Redirect } from 'expo-router';
import { authClient } from '../src/api/authClient';
import { AuthStartupScreen } from '../src/features/auth/AuthStartupScreen';

export default function IndexRoute(): JSX.Element {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthStartupScreen isLoading />;
  }

  if (session?.user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
