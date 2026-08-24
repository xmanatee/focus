import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { isRecord } from '../../shared/validation';
import type { ActivitySelectionMetadata } from '../blocker/types';
import { PRESETS, type PresetKind } from './presets';

interface TemplateState {
  readonly metadata: Partial<Record<PresetKind, ActivitySelectionMetadata>>;
  readonly setMetadata: (
    kind: PresetKind,
    metadata: ActivitySelectionMetadata,
  ) => void;
}

function parseMetadata(value: unknown): ActivitySelectionMetadata {
  if (!isRecord(value)) {
    throw new Error('Stored template selection is invalid.');
  }
  const counts = [
    value.applicationCount,
    value.categoryCount,
    value.webDomainCount,
  ];
  if (
    counts.some((count) => !Number.isInteger(count) || Number(count) < 0) ||
    typeof value.includeEntireCategory !== 'boolean'
  ) {
    throw new Error('Stored template selection is invalid.');
  }
  return {
    applicationCount: Number(value.applicationCount),
    categoryCount: Number(value.categoryCount),
    webDomainCount: Number(value.webDomainCount),
    includeEntireCategory: value.includeEntireCategory,
  };
}

function mergePersistedTemplates(
  state: unknown,
  current: TemplateState,
): TemplateState {
  if (state === undefined) return current;
  if (!isRecord(state) || !isRecord(state.metadata)) {
    throw new Error('Stored templates are invalid.');
  }
  const presetKinds = new Set(Object.keys(PRESETS));
  const entries = Object.entries(state.metadata);
  if (entries.some(([kind]) => !presetKinds.has(kind))) {
    throw new Error('Stored template kind is invalid.');
  }
  return {
    ...current,
    metadata: Object.fromEntries(
      entries.map(([kind, metadata]) => [kind, parseMetadata(metadata)]),
    ),
  };
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      metadata: {},
      setMetadata: (kind, metadata) =>
        set((state) => ({
          metadata: {
            ...state.metadata,
            [kind]: metadata,
          },
        })),
    }),
    {
      name: 'focusblocks.templates',
      storage: persistedStorage,
      skipHydration: true,
      merge: mergePersistedTemplates,
    },
  ),
);
