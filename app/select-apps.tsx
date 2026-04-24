import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import {
  type ActivitySelectionMetadata,
  DeviceActivitySelectionSheetViewPersisted,
} from 'react-native-device-activity';
import { api } from '../convex/_generated/api';
import { RequireAuth } from '../src/features/auth/RequireAuth';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../src/features/blocker/constants';
import { createActivitySelectionFromMetadata } from '../src/features/blocker/types';
import { useProfileStore } from '../src/features/profile/useProfileStore';
import { useActiveSchedule } from '../src/features/schedule/useActiveSchedule';
import { useAdminState } from '../src/features/settings/useAdminState';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

export default function SelectAppsRoute(): JSX.Element {
  return (
    <RequireAuth>
      <SelectAppsScreen />
    </RequireAuth>
  );
}

function SelectAppsScreen(): JSX.Element {
  const router = useRouter();
  const profiles = useQuery(api.profiles.list);
  const schedules = useQuery(api.schedules.get);
  const profile = profiles?.[0] ?? null;
  const setSelection = useProfileStore((s) => s.setSelection);
  const { error, run } = useAsyncAction();
  const { active } = useActiveSchedule(schedules);
  const { state: adminState } = useAdminState();
  const isLocked = active !== null || adminState.kind === 'locked';

  useEffect(() => {
    if (isLocked) {
      router.back();
    }
  }, [isLocked, router]);

  const handleSelectionChange = (event: {
    nativeEvent: ActivitySelectionMetadata;
  }): Promise<boolean> =>
    run(async () => {
      if (!profile) {
        throw new Error('Blocklist is still loading.');
      }
      if (isLocked) {
        throw new Error('Blocklist is locked right now.');
      }
      void haptic.select();
      await setSelection(profile._id, profile.name, {
        activitySelection: createActivitySelectionFromMetadata(
          event.nativeEvent,
        ),
        webDomains: profile.selection.webDomains,
      });
    }, 'Could not save selection.');

  return (
    <Screen padded={false}>
      <View className="px-6 py-4">
        <Typography variant="label" tone="muted">
          Apple picker
        </Typography>
        <Typography variant="display-md" tone="ink">
          What distracts you.
        </Typography>
        {error ? (
          <Typography variant="caption" tone="danger" className="mt-2">
            {error}
          </Typography>
        ) : null}
      </View>
      <DeviceActivitySelectionSheetViewPersisted
        familyActivitySelectionId={BLOCK_ACTIVITY_SELECTION_ID}
        style={{ flex: 1 }}
        onSelectionChange={(event) => {
          void handleSelectionChange(event);
        }}
        onDismissRequest={() => router.back()}
      />
    </Screen>
  );
}
