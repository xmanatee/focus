import { vi } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';

export const storageMap = new Map<string, string>();

vi.mock('../shared/storage', () => ({
  persistedStorage: createJSONStorage(() => ({
    getItem: (key: string) => storageMap.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storageMap.set(key, value);
    },
    removeItem: (key: string) => {
      storageMap.delete(key);
    },
  })),
  attachCloudSync: () => () => {},
  newId: () => 'test-id',
}));
