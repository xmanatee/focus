import { useEffect, useState } from 'react';
import { ConfirmStep } from '../src/features/protection/components/wizard/ConfirmStep';
import { DefenseSetupStep } from '../src/features/protection/components/wizard/DefenseSetupStep';
import { IntroStep } from '../src/features/protection/components/wizard/IntroStep';
import { protectionCopy } from '../src/features/protection/copy';
import { useTamperSetupStore } from '../src/features/protection/useTamperSetupStore';
import {
  type WizardStep,
  resolveWizardStep,
} from '../src/features/protection/wizardProgress';
import { InfoBanner } from '../src/shared/components/InfoBanner';
import { useDismiss } from '../src/shared/hooks/useDismiss';

const NEXT: Record<WizardStep, WizardStep> = {
  intro: 'screenTimeLock',
  screenTimeLock: 'appDeletion',
  appDeletion: 'confirm',
  confirm: 'confirm',
};

export default function ProtectionWizardScreen(): JSX.Element {
  const onClose = useDismiss();
  const setup = useTamperSetupStore((s) => s.setup);
  const markIntroSeen = useTamperSetupStore((s) => s.markIntroSeen);
  const entryStep = resolveWizardStep(setup);
  const [step, setStep] = useState<WizardStep>(entryStep);

  useEffect(() => {
    setStep(entryStep);
  }, [entryStep]);

  const onNext = (): void => setStep((current) => NEXT[current]);

  switch (step) {
    case 'intro':
      return (
        <IntroStep
          onNext={() => {
            markIntroSeen();
            onNext();
          }}
          onClose={onClose}
        />
      );
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
