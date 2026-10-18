import { NativeModules } from 'react-native';
import { parseSelectableApplications } from './BlockerBridge.shared';
import type {
  AndroidBlockerModule,
  SelectableApplication,
} from './BlockerBridge.types';

export function androidBlockerNativeModule(): AndroidBlockerModule {
  const module = NativeModules.FocusAndroidBlocker as
    | AndroidBlockerModule
    | undefined;
  if (module === undefined) {
    throw new Error('FocusAndroidBlocker native module is not linked.');
  }
  return module;
}

export async function listSelectableApplications(): Promise<
  readonly SelectableApplication[]
> {
  return parseSelectableApplications(
    await androidBlockerNativeModule().listSelectableApplications(),
  );
}
