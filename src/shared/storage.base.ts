import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export { AsyncStorage };

export const deviceStorage = AsyncStorage;
export const localStorage = createJSONStorage(() => AsyncStorage);

export function newId(): string {
  return `${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}
