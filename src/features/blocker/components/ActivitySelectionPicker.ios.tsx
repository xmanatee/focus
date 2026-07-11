import { DeviceActivitySelectionSheetViewPersisted } from 'react-native-device-activity';
import type { ActivitySelectionMetadata, SelectionSlotId } from '../types';

interface ActivitySelectionPickerProps {
  readonly familyActivitySelectionId: SelectionSlotId;
  readonly includeEntireCategory: boolean;
  readonly onDismissRequest: () => void;
  readonly onSelectionChange: (metadata: ActivitySelectionMetadata) => void;
}

export function ActivitySelectionPicker(
  props: ActivitySelectionPickerProps,
): JSX.Element {
  return (
    <DeviceActivitySelectionSheetViewPersisted
      familyActivitySelectionId={props.familyActivitySelectionId}
      includeEntireCategory={props.includeEntireCategory}
      onDismissRequest={props.onDismissRequest}
      onSelectionChange={(event) => props.onSelectionChange(event.nativeEvent)}
    />
  );
}
