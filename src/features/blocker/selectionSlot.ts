import { BlockerBridge } from '../../bridge/BlockerBridge';
import type { SelectionSlotId } from './types';

export function getSlotValue(slotId: SelectionSlotId): string | undefined {
  return BlockerBridge.getSelectionSlotValue(slotId);
}

export function isSlotPopulated(slotId: SelectionSlotId): boolean {
  return Boolean(getSlotValue(slotId));
}

export function writeSlot(
  slotId: SelectionSlotId,
  value: string | undefined,
): void {
  BlockerBridge.setSelectionSlotValue(slotId, value);
}

export function copySlot(from: SelectionSlotId, to: SelectionSlotId): void {
  writeSlot(to, getSlotValue(from));
}

export function clearSlot(slotId: SelectionSlotId): void {
  writeSlot(slotId, undefined);
}
