import AsyncStorage from '@react-native-async-storage/async-storage';
import { newId } from '../../shared/storage';

const DEVICE_ID_KEY = 'focusblocks.local-device-id';

export async function getLocalDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing !== null) return existing;
  const id = newId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
