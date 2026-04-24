import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import {
  type ActivitySelectionMetadata,
  DeviceActivitySelectionSheetViewPersisted,
} from 'react-native-device-activity';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../src/features/blocker/constants';
import { createActivitySelectionFromMetadata } from '../src/features/blocker/types';
import { useBlocklistStore } from '../src/features/blocker/useBlocklistStore';
import { useActiveSchedule } from '../src/features/schedule/useActiveSchedule';
import { useScheduleStore } from '../src/features/schedule/useScheduleStore';
import { useAdminState } from '../src/features/settings/useAdminState';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

export default function SelectAppsScreen(): JSX.Element {
  const router = useRouter();
  const setActivitySelection = useBlocklistStore((s) => s.setActivitySelection);
  const schedules = useScheduleStore((s) => s.schedules);
  const { error, run } = useAsyncAction();
  const { active } = useActiveSchedule(schedules);
  const { state: adminState, isSettled } = useAdminState();
  const isLocked = active !== null || adminState.kind === 'locked';

  useEffect(() => {
    if (isSettled && isLocked) {
      router.back();
    }
  }, [isLocked, isSettled, router]);

  const handleSelectionChange = (event: {
    nativeEvent: ActivitySelectionMetadata;
  }): Promise<boolean> =>
    run(async () => {
      if (isLocked) {
        throw new Error('Blocklist is locked right now.');
      }
      void haptic.select();
      setActivitySelection(
        createActivitySelectionFromMetadata(event.nativeEvent),
      );
    }, 'Could not save selection.');

  return (
    <Screen padded={false}>
      <View className="px-6 py-4 flex-row justify-between items-center">
        <View>
          <Typography variant="label" tone="muted">
            Blocklist
          </Typography>
          <Typography variant="display-md" tone="ink">
            Select apps.
          </Typography>
        </View>
        <Pressable onPress={() => router.back()}>
          <Typography variant="body-md" tone="signal">
            Done
          </Typography>
        </Pressable>
      </View>
      {error ? (
        <View className="px-6 pb-2">
          <Typography variant="caption" tone="danger">
            {error}
          </Typography>
        </View>
      ) : null}
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
