import { useRouter } from 'expo-router';
import { useState } from 'react';
import { AppDeletionStep } from '../src/features/protection/components/wizard/AppDeletionStep';
import { ConfirmStep } from '../src/features/protection/components/wizard/ConfirmStep';
import { IntroStep } from '../src/features/protection/components/wizard/IntroStep';
import { ScreenTimeLockStep } from '../src/features/protection/components/wizard/ScreenTimeLockStep';

type WizardStep = 'intro' | 'screenTimeLock' | 'appDeletion' | 'confirm';

const NEXT: Record<WizardStep, WizardStep> = {
  intro: 'screenTimeLock',
  screenTimeLock: 'appDeletion',
  appDeletion: 'confirm',
  confirm: 'confirm',
};

export default function ProtectionWizardScreen(): JSX.Element {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('intro');

  const onClose = (): void => router.back();
  const onNext = (): void => setStep((current) => NEXT[current]);

  switch (step) {
    case 'intro':
      return <IntroStep onNext={onNext} onClose={onClose} />;
    case 'screenTimeLock':
      return <ScreenTimeLockStep onNext={onNext} onClose={onClose} />;
    case 'appDeletion':
      return <AppDeletionStep onNext={onNext} onClose={onClose} />;
    case 'confirm':
      return <ConfirmStep onClose={onClose} />;
  }
}
