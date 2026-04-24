import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import {
  type ActivitySelectionMetadata,
  DeviceActivitySelectionSheetViewPersisted,
} from 'react-native-device-activity';
import { BLOCK_ACTIVITY_SELECTION_ID } from '../src/features/blocker/constants';
import { createActivitySelectionFromMetadata } from '../src/features/blocker/types';
import { Typography } from '../src/shared/components/Typography';
import { useBlockerStore } from '../src/store/useBlockerStore';

export default function SelectAppsScreen() {
  const router = useRouter();
  const setActivitySelection = useBlockerStore(
    (state) => state.setActivitySelection,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectionChange = async (event: {
    nativeEvent: ActivitySelectionMetadata;
  }) => {
    setErrorMessage(null);
    try {
      await setActivitySelection(
        createActivitySelectionFromMetadata(event.nativeEvent),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not save selection.',
      );
    }
  };

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
        {errorMessage ? (
          <Typography
            variant="caption"
            align="center"
            className="mt-4 text-red-600"
          >
            {errorMessage}
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
