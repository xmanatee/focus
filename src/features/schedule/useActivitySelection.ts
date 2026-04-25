import { useEffect, useMemo, useRef, useState } from 'react';
import {
  clearSlot,
  copySlot,
  getSlotValue,
  writeSlot,
} from '../blocker/selectionSlot';
import {
  type ActivitySelectionMetadata,
  type PersistedActivitySelection,
  type SelectionSlotId,
  createActivitySelectionFromMetadata,
  selectionIdForBlock,
} from '../blocker/types';
import { applyTemplateSelection } from './activitySelectionLogic';
import { selectionIdForTemplate } from './presets';
import type { PresetKind } from './presets';
import { useTemplateStore } from './useTemplateStore';

type PickerTarget =
  | { mode: 'block' }
  | { mode: 'template'; kind: PresetKind }
  | null;

interface PickerSession {
  readonly slotId: SelectionSlotId;
  readonly includeEntireCategory: boolean;
  readonly onSelectionChange: (metadata: ActivitySelectionMetadata) => void;
}

export function useActivitySelection(
  blockId: string,
  editId: string | null,
  initialSelection: PersistedActivitySelection,
): {
  activitySelection: PersistedActivitySelection;
  pickerSession: PickerSession | null;
  applyTemplate: (
    kind: PresetKind,
  ) => PersistedActivitySelection | 'needs-setup';
  openBlockPicker: () => void;
  openTemplatePicker: (kind: PresetKind) => void;
  closePicker: () => void;
  markSaved: () => void;
} {
  const [activitySelection, setActivitySelection] =
    useState<PersistedActivitySelection>(initialSelection);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const wasSavedRef = useRef(false);

  const templateMetadata = useTemplateStore((state) => state.metadata);
  const setTemplateMetadata = useTemplateStore((state) => state.setMetadata);

  const blockSlot = useMemo(() => selectionIdForBlock(blockId), [blockId]);

  const pickerSession = useMemo<PickerSession | null>(() => {
    if (pickerTarget === null) return null;

    const currentIncludeEntireCategory =
      activitySelection.status === 'saved'
        ? activitySelection.includeEntireCategory
        : true;

    if (pickerTarget.mode === 'block') {
      return {
        slotId: blockSlot,
        includeEntireCategory: currentIncludeEntireCategory,
        onSelectionChange: (metadata) =>
          setActivitySelection(createActivitySelectionFromMetadata(metadata)),
      };
    }
    const { kind } = pickerTarget;
    const templateSlot = selectionIdForTemplate(kind);
    return {
      slotId: templateSlot,
      includeEntireCategory: currentIncludeEntireCategory,
      onSelectionChange: (metadata) => {
        setTemplateMetadata(kind, metadata);
        copySlot(templateSlot, blockSlot);
        setActivitySelection(createActivitySelectionFromMetadata(metadata));
      },
    };
  }, [pickerTarget, blockSlot, setTemplateMetadata, activitySelection]);

  useEffect(() => {
    if (editId === null) {
      return () => {
        if (wasSavedRef.current) return;
        clearSlot(blockSlot);
      };
    }
    const snapshot = getSlotValue(blockSlot);
    return () => {
      if (wasSavedRef.current) return;
      writeSlot(blockSlot, snapshot);
    };
  }, [blockSlot, editId]);

  return {
    activitySelection,
    pickerSession,
    applyTemplate: (kind) => {
      const result = applyTemplateSelection(blockId, kind, templateMetadata);
      if (result !== 'needs-setup') setActivitySelection(result);
      return result;
    },
    openBlockPicker: () => setPickerTarget({ mode: 'block' }),
    openTemplatePicker: (kind) => setPickerTarget({ mode: 'template', kind }),
    closePicker: () => setPickerTarget(null),
    markSaved: () => {
      wasSavedRef.current = true;
    },
  };
}
