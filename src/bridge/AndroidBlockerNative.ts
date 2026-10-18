import { NativeModules } from 'react-native';
import type { AndroidBlockerModule } from './BlockerBridge.types';

export function androidBlockerNativeModule(): AndroidBlockerModule {
  const module = NativeModules.FocusAndroidBlocker as
    | AndroidBlockerModule
    | undefined;
  if (module === undefined) {
    throw new Error('FocusAndroidBlocker native module is not linked.');
  }
  return module;
}
