import { Alert } from 'react-native';
import { protectionCopy } from '../protection/copy';

interface ConfirmStrictModeArgs {
  readonly enableBody: string;
  readonly tamperReady: boolean;
  readonly onConfirm: () => void;
  readonly onSetUpFirst: () => void;
}

export function confirmStrictModeOn({
  enableBody,
  tamperReady,
  onConfirm,
  onSetUpFirst,
}: ConfirmStrictModeArgs): void {
  const copy = protectionCopy.strictMode;
  if (tamperReady) {
    Alert.alert(copy.enableTitle, enableBody, [
      { text: 'Cancel', style: 'cancel' },
      { text: copy.enableConfirm, onPress: onConfirm },
    ]);
    return;
  }
  Alert.alert(copy.softBlockTitle, copy.softBlockBody, [
    { text: 'Cancel', style: 'cancel' },
    { text: copy.softBlockSetup, onPress: onSetUpFirst },
    {
      text: copy.softBlockAnyway,
      style: 'destructive',
      onPress: onConfirm,
    },
  ]);
}
