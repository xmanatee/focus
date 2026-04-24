import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/shared/components/Button';
import { Typography } from '../../src/shared/components/Typography';
import { useBlockerStore } from '../../src/store/useBlockerStore';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuthActions();

  const isActive = useBlockerStore((state) => state.isActive);
  const hasPermissions = useBlockerStore((state) => state.hasPermissions);
  const busyState = useBlockerStore((state) => state.busyState);
  const initializationError = useBlockerStore(
    (state) => state.initializationError,
  );
  const activitySelection = useBlockerStore(
    (state) => state.selection.activitySelection,
  );

  const setBlockerEnabled = useBlockerStore((state) => state.setBlockerEnabled);
  const requestPermissions = useBlockerStore(
    (state) => state.requestPermissions,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestPermissions = async () => {
    setErrorMessage(null);
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setErrorMessage('Screen Time permission was not granted.');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not request Screen Time permission.',
      );
    }
  };

  const handleToggle = async () => {
    setErrorMessage(null);
    try {
      await setBlockerEnabled(!isActive);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update blocker.',
      );
    }
  };

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
              onPress={() => router.push('../select-apps')}
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

        {errorMessage ?? initializationError ? (
          <Typography
            variant="caption"
            align="center"
            className="mt-4 text-red-600"
          >
            {errorMessage ?? initializationError}
          </Typography>
        ) : null}
      </View>
    </View>
  );
}
