import { setFamilyActivitySelectionId } from 'react-native-device-activity';
import { selectionIdForBlock } from './types';

export function clearSelectionSlot(blockId: string): void {
  setFamilyActivitySelectionId({
    id: selectionIdForBlock(blockId),
    familyActivitySelection: '',
  });
}
