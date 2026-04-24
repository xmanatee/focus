import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistedStorage } from '../../shared/storage';
import { parseBlockedDomain } from './domain';
import {
  type BlockSelection,
  EMPTY_BLOCK_SELECTION,
  type PersistedActivitySelection,
} from './types';

interface BlocklistState {
  selection: BlockSelection;
  setActivitySelection: (next: PersistedActivitySelection) => void;
  setWebDomains: (domains: string[]) => void;
  addWebDomain: (input: string) => void;
  removeWebDomain: (domain: string) => void;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

export const useBlocklistStore = create<BlocklistState>()(
  persist(
    (set, get) => ({
      selection: EMPTY_BLOCK_SELECTION,

      setActivitySelection: (next) =>
        set((state) => ({
          selection: { ...state.selection, activitySelection: next },
        })),

      setWebDomains: (domains) =>
        set((state) => ({
          selection: { ...state.selection, webDomains: dedupe(domains) },
        })),

      addWebDomain: (input) => {
        const domain = parseBlockedDomain(input);
        if (domain === null) {
          throw new Error('Enter a valid domain like example.com.');
        }
        const existing = get().selection.webDomains;
        if (existing.includes(domain)) {
          return;
        }
        set((state) => ({
          selection: {
            ...state.selection,
            webDomains: dedupe([...existing, domain]),
          },
        }));
      },

      removeWebDomain: (domain) =>
        set((state) => ({
          selection: {
            ...state.selection,
            webDomains: state.selection.webDomains.filter((d) => d !== domain),
          },
        })),
    }),
    {
      name: 'fucus.blocklist',
      storage: persistedStorage,
    },
  ),
);
