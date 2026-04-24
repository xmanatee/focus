import * as Cloud from '@nauverse/expo-cloud-settings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { type StateStorage, createJSONStorage } from 'zustand/middleware';

function cloudIsUsable(): boolean {
  return Platform.OS === 'ios' && Cloud.isAvailable();
}

const cloudBackedStorage: StateStorage = {
  getItem: async (key) => {
    const local = await AsyncStorage.getItem(key);
    if (local !== null) {
      return local;
    }
    if (!cloudIsUsable()) {
      return null;
    }
    const remote = Cloud.getString(key);
    if (remote !== null) {
      await AsyncStorage.setItem(key, remote);
    }
    return remote;
  },
  setItem: async (key, value) => {
    await AsyncStorage.setItem(key, value);
    if (cloudIsUsable()) {
      Cloud.setString(key, value);
    }
  },
  removeItem: async (key) => {
    await AsyncStorage.removeItem(key);
    if (cloudIsUsable()) {
      Cloud.remove(key);
    }
  },
};

export const persistedStorage = createJSONStorage(() => cloudBackedStorage);

export function attachCloudSync(onRemoteChange: () => void): () => void {
  if (!cloudIsUsable()) {
    return () => {};
  }
  const subscription = Cloud.addChangeListener(async (event) => {
    for (const key of event.changedKeys) {
      const value = Cloud.getString(key);
      if (value !== null) {
        await AsyncStorage.setItem(key, value);
      } else {
        await AsyncStorage.removeItem(key);
      }
    }
    onRemoteChange();
  });
  return () => subscription.remove();
}

export function newId(): string {
  return `${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
