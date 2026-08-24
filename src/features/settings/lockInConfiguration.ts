import { focusBlockRunnableLocally } from '../schedule/localRuntime';
import { getFocusBlockRuntimeStatus } from '../schedule/runtimeStatus';
import { useBlockActivationStore } from '../schedule/useBlockActivationStore';
import { useFocusBlockStore } from '../schedule/useFocusBlockStore';
import { type SetupBlock, assertAdminUnlocked } from './adminState';
import { resolveLockInEnablement } from './lockInEnablement';
import { useSetupBlockDeviceStore } from './setupBlockDeviceStore';
import { useSettingsStore } from './useSettingsStore';
import { validateSetupBlock } from './validation';

function assertLockInEditable(now: Date): void {
  assertAdminUnlocked(
    useSettingsStore.getState().setupBlock,
    useSetupBlockDeviceStore.getState().isEnabledOnDevice,
    now,
  );
}

function assertNoActiveStrictBlock(now: Date): void {
  const activation = useBlockActivationStore.getState();
  const hasActiveStrictBlock = useFocusBlockStore
    .getState()
    .focusBlocks.some((block) => {
      if (!block.strict) return false;
      const runtimeBlock = focusBlockRunnableLocally(
        block,
        activation.isBlockEnabled(block.id),
      );
      return getFocusBlockRuntimeStatus(runtimeBlock, now).kind === 'active';
    });
  if (hasActiveStrictBlock) {
    throw new Error('Cannot configure Lock-in while a strict block is active.');
  }
}

export function saveLockInConfiguration(
  block: SetupBlock,
  turnOnThisDevice: boolean,
  now: Date = new Date(),
): void {
  validateSetupBlock(block);
  assertLockInEditable(now);
  assertNoActiveStrictBlock(now);

  if (turnOnThisDevice) {
    const activation = useBlockActivationStore.getState();
    const enablement = resolveLockInEnablement(
      useFocusBlockStore.getState().focusBlocks,
      activation.enabledBlockIds,
    );
    if (enablement.kind === 'blocked') {
      throw new Error(enablement.message);
    }
  }

  useSettingsStore.setState({ setupBlock: block });
  useFocusBlockStore.getState().clearAllStrict();
  if (turnOnThisDevice) {
    useSetupBlockDeviceStore.getState().enableOnDevice();
  }
}

export function turnOffLockIn(now: Date = new Date()): void {
  assertLockInEditable(now);
  useSetupBlockDeviceStore.getState().disableOnDevice();
}

export function removeLockInConfiguration(now: Date = new Date()): void {
  assertLockInEditable(now);
  useSetupBlockDeviceStore.getState().disableOnDevice();
  useSettingsStore.setState({ setupBlock: null });
}

export function reconcileHydratedLockInConfiguration(): void {
  const setupBlock = useSettingsStore.getState().setupBlock;
  useSetupBlockDeviceStore
    .getState()
    .syncSetupBlockPresence(setupBlock !== null);
  if (setupBlock !== null) {
    useFocusBlockStore.getState().clearAllStrict();
  }
}
