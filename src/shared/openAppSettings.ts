import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import { errorMessage } from './errors';

export function openAppSettings(): void {
  void Linking.openSettings().catch((error: unknown) => {
    Alert.alert('Could not open Settings', errorMessage(error));
  });
}
