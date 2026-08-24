import { Alert } from 'react-native';
import { BlockerBridge } from '../../bridge/BlockerBridge';
import { haptic } from '../../shared/design/haptics';
import {
  type AsyncAction,
  useAsyncAction,
} from '../../shared/hooks/useAsyncAction';
import { requestNotificationPermissions } from '../../shared/notifications';
import { selectionHasBlockedTargets } from '../blocker/types';
import type { SetupBlock } from '../settings/adminState';
import { inputUsesBudgetWarning } from './budget';
import { activitySelectionNeedsLocalSlot } from './localActivitySelection';
import { focusBlocksRunnableLocally } from './localRuntime';
import { assertRuntimeMonitorCapacity } from './runtimeCapacity';
import type { FocusBlockInput } from './types';
import { useBlockActivationStore } from './useBlockActivationStore';
import { useFocusBlockStore } from './useFocusBlockStore';
import { validateFocusBlockInput } from './validation';

interface UseFocusBlockSaveArgs {
  readonly editId: string | null;
  readonly newBlockId: string;
  readonly buildInput: () => FocusBlockInput | Promise<FocusBlockInput>;
  readonly markSelectionSaved: () => void;
  readonly setupBlockForThisDevice: SetupBlock | null;
  readonly dismiss: () => void;
}

interface UseFocusBlockSaveResult {
  readonly error: string | null;
  readonly isPending: boolean;
  readonly run: AsyncAction['run'];
  readonly save: () => Promise<void>;
  readonly requestDelete: () => void;
}

export function useFocusBlockSave({
  editId,
  newBlockId,
  buildInput,
  markSelectionSaved,
  setupBlockForThisDevice,
  dismiss,
}: UseFocusBlockSaveArgs): UseFocusBlockSaveResult {
  const addFocusBlock = useFocusBlockStore((s) => s.addFocusBlock);
  const updateFocusBlock = useFocusBlockStore((s) => s.updateFocusBlock);
  const deleteFocusBlock = useFocusBlockStore((s) => s.deleteFocusBlock);
  const { error, isPending, run } = useAsyncAction();

  const save = async (): Promise<void> => {
    const blockId = editId ?? newBlockId;
    const input = await buildInput();
    const success = await run(async () => {
      if (!selectionHasBlockedTargets(input.selection)) {
        throw new Error('Pick at least one app or site to block.');
      }
      if (
        activitySelectionNeedsLocalSlot(
          blockId,
          input.selection.activitySelection,
        )
      ) {
        throw new Error('Pick apps on this device before saving this block.');
      }
      validateFocusBlockInput(input);
      const enabledBlockIds =
        useBlockActivationStore.getState().enabledBlockIds;
      if (editId !== null && enabledBlockIds.includes(editId)) {
        const candidate = {
          ...input,
          id: editId,
          name: input.name.trim(),
        };
        const currentFocusBlocks = useFocusBlockStore.getState().focusBlocks;
        const nextFocusBlocks = currentFocusBlocks.map((block) =>
          block.id === editId ? candidate : block,
        );
        assertRuntimeMonitorCapacity(
          focusBlocksRunnableLocally(nextFocusBlocks, enabledBlockIds),
          setupBlockForThisDevice,
        );
      }
      if (
        BlockerBridge.capabilities.supportsScheduleNotifications &&
        (input.notifyOnStart || input.notifyOnEnd)
      ) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          throw new Error(
            'Notifications permission is required for this block. Enable it in Settings or turn off the notification toggles.',
          );
        }
      } else if (
        BlockerBridge.capabilities.supportsScheduleNotifications &&
        inputUsesBudgetWarning(input)
      ) {
        await requestNotificationPermissions();
      }
      void haptic.commit();
      if (editId) updateFocusBlock(editId, input);
      else addFocusBlock(newBlockId, input);
      markSelectionSaved();
    }, 'Could not save block.');
    if (success) dismiss();
  };

  const requestDelete = (): void => {
    if (!editId) return;
    const deleteCurrentBlock = async (): Promise<void> => {
      const success = await run(async () => {
        void haptic.abandon();
        deleteFocusBlock(editId);
        markSelectionSaved();
      }, 'Could not delete block.');
      if (success) dismiss();
    };

    Alert.alert(
      'Delete Focus Block?',
      'This will permanently remove this focus block.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteCurrentBlock();
          },
        },
      ],
    );
  };

  return { error, isPending, run, save, requestDelete };
}
