import { localStorage } from './storage.base';

export { deviceStorage, localStorage, newId } from './storage.base';

export const persistedStorage = localStorage;

export function attachPersistedStorageSync(): () => void {
  return () => undefined;
}
