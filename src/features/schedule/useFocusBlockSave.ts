import { Alert } from 'react-native';
import { haptic } from '../../shared/design/haptics';
import {
  type AsyncAction,
  useAsyncAction,
} from '../../shared/hooks/useAsyncAction';
import { requestNotificationPermissions } from '../../shared/notifications';
import { selectionHasBlockedTargets } from '../blocker/types';
import { inputUsesBudgetWarning } from './budget';
import { activitySelectionNeedsLocalSlot } from './localActivitySelection';
import type { FocusBlockInput } from './types';
import { useBlockActivationStore } from './useBlockActivationStore';
import { useFocusBlockStore } from './useFocusBlockStore';
import { validateFocusBlockInput } from './validation';

interface UseFocusBlockSaveArgs {
  readonly editId: string | null;
  readonly newBlockId: string;
  readonly buildInput: () => FocusBlockInput | Promise<FocusBlockInput>;
  readonly markSelectionSaved: () => void;
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
  dismiss,
}: UseFocusBlockSaveArgs): UseFocusBlockSaveResult {
  const addFocusBlock = useFocusBlockStore((s) => s.addFocusBlock);
  const updateFocusBlock = useFocusBlockStore((s) => s.updateFocusBlock);
  const deleteFocusBlock = useFocusBlockStore((s) => s.deleteFocusBlock);
  const setBlockEnabled = useBlockActivationStore((s) => s.setBlockEnabled);
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
      if (input.notifyOnStart || input.notifyOnEnd) {
        const granted = await requestNotificationPermissions();
        if (!granted) {
          throw new Error(
            'Notifications permission is required for this block. Enable it in Settings or turn off the notification toggles.',
          );
        }
      } else if (inputUsesBudgetWarning(input)) {
        await requestNotificationPermissions();
      }
      void haptic.commit();
      if (editId) updateFocusBlock(editId, input);
      else {
        addFocusBlock(newBlockId, input);
        setBlockEnabled(newBlockId, true);
      }
      markSelectionSaved();
    }, 'Could not save block.');
    if (success) dismiss();
  };

  const requestDelete = (): void => {
    if (!editId) return;
    Alert.alert(
      'Delete Focus Block?',
      'This will permanently remove this focus block.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void run(async () => {
              void haptic.abandon();
              deleteFocusBlock(editId);
              markSelectionSaved();
            }, 'Could not delete block.').then((success) => {
              if (success) dismiss();
            });
          },
        },
      ],
    );
  };

  return { error, isPending, run, save, requestDelete };
}
