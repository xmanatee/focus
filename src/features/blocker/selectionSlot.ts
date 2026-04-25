import {
  getFamilyActivitySelectionId,
  setFamilyActivitySelectionId,
} from 'react-native-device-activity';
import type { SelectionSlotId } from './types';

export function getSlotValue(slotId: SelectionSlotId): string | undefined {
  return getFamilyActivitySelectionId(slotId);
}

export function isSlotPopulated(slotId: SelectionSlotId): boolean {
  return Boolean(getSlotValue(slotId));
}

export function writeSlot(
  slotId: SelectionSlotId,
  value: string | undefined,
): void {
  setFamilyActivitySelectionId({
    id: slotId,
    familyActivitySelection: value ?? '',
  });
}

export function copySlot(from: SelectionSlotId, to: SelectionSlotId): void {
  writeSlot(to, getSlotValue(from));
}

export function clearSlot(slotId: SelectionSlotId): void {
  writeSlot(slotId, undefined);
}
