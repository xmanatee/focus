import { useRouter } from 'expo-router';
import { View } from 'react-native';
import {
  type ActivitySelectionMetadata,
  DeviceActivitySelectionSheetViewPersisted,
} from 'react-native-device-activity';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../src/features/blocker/constants';
import { createActivitySelectionFromMetadata } from '../src/features/blocker/types';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { Typography } from '../src/shared/components/Typography';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

export default function SelectAppsScreen(): JSX.Element {
  const router = useRouter();
  const setActivitySelection = useBlockerStore(
    (state) => state.setActivitySelection,
  );
  const { error, run } = useAsyncAction();

  const handleSelectionChange = (event: {
    nativeEvent: ActivitySelectionMetadata;
  }): Promise<boolean> =>
    run(
      () =>
        setActivitySelection(
          createActivitySelectionFromMetadata(event.nativeEvent),
        ),
      'Could not save selection.',
    );

  return (
    <View className="flex-1 bg-background">
      <View className="absolute inset-0 items-center justify-center px-8">
        <Typography variant="h3" align="center">
          Loading Screen Time picker
        </Typography>
        <Typography
          variant="caption"
          align="center"
          className="mt-2 text-textMuted"
        >
          If the system picker takes a moment, stay on this screen.
        </Typography>
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
      <DeviceActivitySelectionSheetViewPersisted
        familyActivitySelectionId={BLOCK_ACTIVITY_SELECTION_ID}
        style={{ flex: 1 }}
        onSelectionChange={(event) => {
          void handleSelectionChange(event);
        }}
        onDismissRequest={() => router.back()}
      />
    </View>
  );
}
