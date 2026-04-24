import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
import { Button } from '../../src/shared/components/Button';
import { Typography } from '../../src/shared/components/Typography';
import { useAsyncAction } from '../../src/shared/hooks/useAsyncAction';

export default function DashboardScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuthActions();

  const isActive = useBlockerStore((state) => state.isActive);
  const hasPermissions = useBlockerStore((state) => state.hasPermissions);
  const busyState = useBlockerStore((state) => state.busyState);
  const activitySelection = useBlockerStore(
    (state) => state.selection.activitySelection,
  );
  const setBlockerEnabled = useBlockerStore((state) => state.setBlockerEnabled);
  const requestPermissions = useBlockerStore(
    (state) => state.requestPermissions,
  );

  const { error, run } = useAsyncAction();

  const handleRequestPermissions = (): Promise<boolean> =>
    run(async () => {
      const granted = await requestPermissions();
      if (!granted) {
        throw new Error('Screen Time permission was not granted.');
      }
    }, 'Could not request Screen Time permission.');

  const handleToggle = (): Promise<boolean> =>
    run(() => setBlockerEnabled(!isActive), 'Could not update blocker.');

  const selectedAppsLabel =
    activitySelection.status === 'saved'
      ? `${activitySelection.applicationCount} apps, ${activitySelection.categoryCount} categories, ${activitySelection.webDomainCount} web selections`
      : 'No app selection saved yet.';

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className="flex-row justify-between items-center mt-8 mb-8">
        <Typography variant="h1">Fucus.</Typography>
        <Button
          title="Sign Out"
          variant="secondary"
          onPress={() => void signOut()}
        />
      </View>

      <View className="flex-1 justify-center">
        <View
          className={`w-64 h-64 rounded-full border-[16px] self-center items-center justify-center mb-12 ${
            isActive ? 'border-primary' : 'border-gray-200'
          }`}
        >
          <Typography variant="h2" align="center">
            {isActive ? 'BLOCKED' : 'IDLE'}
          </Typography>
        </View>

        {!hasPermissions ? (
          <View className="gap-4">
            <Typography variant="body" align="center" className="mb-4">
              We need Screen Time access to block distracting apps and websites.
            </Typography>
            <Button
              title="Grant Permissions"
              onPress={() => void handleRequestPermissions()}
              isLoading={busyState === 'authorizing'}
              disabled={busyState !== 'idle'}
            />
          </View>
        ) : (
          <View className="gap-4">
            <Typography
              variant="caption"
              align="center"
              className="text-textMuted"
            >
              {selectedAppsLabel}
            </Typography>
            <Button
              title="Choose Apps to Block"
              variant="secondary"
              onPress={() => router.push('/select-apps')}
              disabled={busyState !== 'idle'}
            />
            <Button
              title={isActive ? 'Stop Session' : 'Start Focus Session'}
              variant={isActive ? 'danger' : 'primary'}
              onPress={() => void handleToggle()}
              isLoading={busyState === 'syncing'}
              disabled={busyState !== 'idle'}
            />
          </View>
        )}

        {error ? (
          <Typography
            variant="caption"
            align="center"
            className="mt-4 text-red-600"
          >
            {error}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}
