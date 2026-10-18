import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { BlockerBridge } from '../../bridge/BlockerBridge';
import { openAppSettings } from '../../shared/openAppSettings';
import { useBlockerStore } from '../blocker/useBlockerStore';
import type { SetupVerificationAction } from './diagnostics';

export function useSetupActionHandler(): (
  action: SetupVerificationAction,
) => void {
  const router = useRouter();
  const authorization = useBlockerStore((s) => s.access.authorization);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);
  const requestRuntimePermissions = useBlockerStore(
    (s) => s.requestRuntimePermissions,
  );

  return useCallback(
    (action: SetupVerificationAction) => {
      switch (action) {
        case 'requestBlockingAccess':
          if (
            authorization.status === 'denied' &&
            BlockerBridge.capabilities.deniedAuthorizationAction ===
              'appSettings'
          ) {
            openAppSettings();
          } else {
            void requestPermissions();
          }
          return;
        case 'requestDailyBudgetAccess':
          void requestRuntimePermissions('dailyBudgets');
          return;
        case 'requestWebsiteBlockingAccess':
          void requestRuntimePermissions('websiteBlocking');
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
    [authorization, requestPermissions, requestRuntimePermissions, router],
  );
}
