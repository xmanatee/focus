import * as Cloud from '@nauverse/expo-cloud-settings';
import { type StateStorage, createJSONStorage } from 'zustand/middleware';
import { AsyncStorage } from './storage.base';

const cloudBackedStorage: StateStorage = {
  getItem: async (key) => {
    if (!Cloud.isAvailable()) {
      return AsyncStorage.getItem(key);
    }
    const remote = Cloud.getString(key);
    if (remote !== null) {
      await AsyncStorage.setItem(key, remote);
    } else {
      await AsyncStorage.removeItem(key);
    }
    return remote;
  },
  setItem: async (key, value) => {
    if (Cloud.isAvailable()) {
      Cloud.setString(key, value);
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (Cloud.isAvailable()) {
      Cloud.remove(key);
    }
    await AsyncStorage.removeItem(key);
  },
};

export const persistedStorage = createJSONStorage(() => cloudBackedStorage);
export { deviceStorage, localStorage, newId } from './storage.base';

export function attachPersistedStorageSync(
  onRemoteChange: () => void,
  onError: (error: unknown) => void,
): () => void {
  if (!Cloud.isAvailable()) {
    return () => {};
  }
  const subscription = Cloud.addChangeListener(async (event) => {
    try {
      for (const key of event.changedKeys) {
        const value = Cloud.getString(key);
        if (value !== null) {
          await AsyncStorage.setItem(key, value);
        } else {
          await AsyncStorage.removeItem(key);
        }
      }
      onRemoteChange();
    } catch (error) {
      onError(error);
    }
  });
  return () => subscription.remove();
}
