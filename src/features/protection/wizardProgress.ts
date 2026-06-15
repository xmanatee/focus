import type { TamperSetup } from './types';

export type WizardStep = 'intro' | 'screenTimeLock' | 'appDeletion' | 'confirm';

export function resolveWizardStep(setup: TamperSetup): WizardStep {
  if (!setup.hasSeenIntro) {
    return 'intro';
  }

  if (setup.acks.screenTimeLock.kind !== 'set') {
    return 'screenTimeLock';
  }

  if (setup.acks.appDeletion.kind !== 'set') {
    return 'appDeletion';
  }

  return 'confirm';
}
