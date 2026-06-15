import { useMemo } from 'react';
import { isSlotPopulated } from '../blocker/selectionSlot';
import { selectionIdForBlock } from '../blocker/types';
import { useBlockerStore } from '../blocker/useBlockerStore';
import { useLocalDeviceId } from '../device/useLocalDeviceId';
import { useProtectionPosture } from '../protection/useProtectionPosture';
import { useFocusBlockStore } from '../schedule/useFocusBlockStore';
import { useSetupBlockDeviceStore } from '../settings/setupBlockDeviceStore';
import { useSettingsStore } from '../settings/useSettingsStore';
import type { DiagnosticsInput } from './diagnostics';

type DiagnosticsSnapshot = Omit<DiagnosticsInput, 'generatedAt' | 'now'>;

export function useDiagnosticsSnapshot(): DiagnosticsSnapshot {
  const authorizationStatus = useBlockerStore((s) => s.authorizationStatus);
  const deviceId = useLocalDeviceId();
  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const posture = useProtectionPosture();
  const setupBlock = useSettingsStore((s) => s.setupBlock);
  const setupBlockEnabledOnDevice = useSetupBlockDeviceStore(
    (s) => s.isEnabledOnDevice,
  );

  const populatedSelectionSlots = useMemo(() => {
    const slots = new Set<string>();
    for (const block of focusBlocks) {
      const slotId = selectionIdForBlock(block.id);
      if (isSlotPopulated(slotId)) slots.add(slotId);
    }
    return slots;
  }, [focusBlocks]);

  return {
    authorizationStatus,
    deviceId,
    focusBlocks,
    populatedSelectionSlots,
    posture,
    setupBlock,
    setupBlockEnabledOnDevice,
  };
}
