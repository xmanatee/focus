import { useRouter } from 'expo-router';
import { View } from 'react-native';
import {
  type ActivitySelectionMetadata,
  DeviceActivitySelectionSheetViewPersisted,
} from 'react-native-device-activity';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../src/features/blocker/constants';
import { createActivitySelectionFromMetadata } from '../src/features/blocker/types';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

export default function SelectAppsScreen(): JSX.Element {
  const router = useRouter();
  const setActivitySelection = useBlockerStore((s) => s.setActivitySelection);
  const { error, run } = useAsyncAction();

  const handleSelectionChange = (event: {
    nativeEvent: ActivitySelectionMetadata;
  }): Promise<boolean> =>
    run(async () => {
      void haptic.select();
      await setActivitySelection(
        createActivitySelectionFromMetadata(event.nativeEvent),
      );
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
