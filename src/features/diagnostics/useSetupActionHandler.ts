import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useBlockerStore } from '../blocker/useBlockerStore';
import type { SetupVerificationAction } from './diagnostics';

export function useSetupActionHandler(): (
  action: SetupVerificationAction,
) => void {
  const router = useRouter();
  const authorizationStatus = useBlockerStore((s) => s.authorizationStatus);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);

  return useCallback(
    (action: SetupVerificationAction) => {
      switch (action) {
        case 'requestScreenTime':
          if (authorizationStatus === 'denied') {
            void Linking.openSettings();
          } else {
            void requestPermissions();
          }
          return;
        case 'finishDeviceSetup':
          router.push('/finish-device');
          return;
        case 'openDiagnostics':
          router.push('/diagnostics');
          return;
        case 'openProtection':
          router.push('/protection');
          return;
        case 'addBlock':
          router.push('/add-focus-block');
          return;
      }
    },
    [authorizationStatus, requestPermissions, router],
  );
}
