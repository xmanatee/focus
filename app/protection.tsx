import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ConfirmStep } from '../src/features/protection/components/wizard/ConfirmStep';
import { IntroStep } from '../src/features/protection/components/wizard/IntroStep';
import { PasscodeStep } from '../src/features/protection/components/wizard/PasscodeStep';
import { RestrictionsStep } from '../src/features/protection/components/wizard/RestrictionsStep';

type WizardStep = 'intro' | 'passcode' | 'restrictions' | 'confirm';

const NEXT: Record<WizardStep, WizardStep> = {
  intro: 'passcode',
  passcode: 'restrictions',
  restrictions: 'confirm',
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
    case 'passcode':
      return <PasscodeStep onNext={onNext} onClose={onClose} />;
    case 'restrictions':
      return <RestrictionsStep onNext={onNext} onClose={onClose} />;
    case 'confirm':
      return <ConfirmStep onClose={onClose} />;
  }
}
