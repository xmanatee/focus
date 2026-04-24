import * as Cloud from '@nauverse/expo-cloud-settings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { type StateStorage, createJSONStorage } from 'zustand/middleware';

function cloudIsUsable(): boolean {
  return Platform.OS === 'ios' && Cloud.isAvailable();
}

const cloudBackedStorage: StateStorage = {
  getItem: async (key) => {
    try {
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
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      if (cloudIsUsable()) {
        Cloud.setString(key, value);
      }
    } catch {
      // Ignore storage failures to prevent app crash
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      if (cloudIsUsable()) {
        Cloud.remove(key);
      }
    } catch {
      // Ignore storage failures to prevent app crash
    }
  },
};

export const persistedStorage = createJSONStorage(() => cloudBackedStorage);

export function attachCloudSync(onRemoteChange: () => void): () => void {
  if (!cloudIsUsable()) {
    return () => {};
  }
  try {
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
      } catch {
        // Silently ignore sync issues
      }
    });
    return () => subscription.remove();
  } catch {
    return () => {};
  }
}

export function newId(): string {
  return `${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
