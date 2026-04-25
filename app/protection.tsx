import { useState } from 'react';
import { ConfirmStep } from '../src/features/protection/components/wizard/ConfirmStep';
import { DefenseSetupStep } from '../src/features/protection/components/wizard/DefenseSetupStep';
import { IntroStep } from '../src/features/protection/components/wizard/IntroStep';
import { protectionCopy } from '../src/features/protection/copy';
import { InfoBanner } from '../src/shared/components/InfoBanner';
import { useDismiss } from '../src/shared/hooks/useDismiss';

type WizardStep = 'intro' | 'screenTimeLock' | 'appDeletion' | 'confirm';

const NEXT: Record<WizardStep, WizardStep> = {
  intro: 'screenTimeLock',
  screenTimeLock: 'appDeletion',
  appDeletion: 'confirm',
  confirm: 'confirm',
};

export default function ProtectionWizardScreen(): JSX.Element {
  const onClose = useDismiss();
  const [step, setStep] = useState<WizardStep>('intro');

  const onNext = (): void => setStep((current) => NEXT[current]);

  switch (step) {
    case 'intro':
      return <IntroStep onNext={onNext} onClose={onClose} />;
    case 'screenTimeLock':
      return (
        <DefenseSetupStep
          defense="screenTimeLock"
          step={2}
          onNext={onNext}
          onClose={onClose}
        >
          <InfoBanner
            variant="info"
            title={protectionCopy.screenTimeLock.trustedFriendTitle}
          >
            {protectionCopy.screenTimeLock.trustedFriendBody}
          </InfoBanner>
        </DefenseSetupStep>
      );
    case 'appDeletion':
      return (
        <DefenseSetupStep
          defense="appDeletion"
          step={3}
          onNext={onNext}
          onClose={onClose}
        />
      );
    case 'confirm':
      return <ConfirmStep onClose={onClose} />;
  }
}
