import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BlockerBridge } from '../src/bridge/BlockerBridge';
import { ConfirmStep } from '../src/features/protection/components/wizard/ConfirmStep';
import { DefenseSetupStep } from '../src/features/protection/components/wizard/DefenseSetupStep';
import { IntroStep } from '../src/features/protection/components/wizard/IntroStep';
import { protectionCopy } from '../src/features/protection/copy';
import { useTamperSetupStore } from '../src/features/protection/useTamperSetupStore';
import {
  type WizardStep,
  resolveWizardStep,
} from '../src/features/protection/wizardProgress';
import { Button } from '../src/shared/components/Button';
import { Card } from '../src/shared/components/Card';
import { InfoBanner } from '../src/shared/components/InfoBanner';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { useDismiss } from '../src/shared/hooks/useDismiss';

const NEXT: Record<WizardStep, WizardStep> = {
  intro: 'screenTimeLock',
  screenTimeLock: 'appDeletion',
  appDeletion: 'confirm',
  confirm: 'confirm',
};

export default function ProtectionWizardScreen(): React.JSX.Element {
  const onClose = useDismiss();
  const setup = useTamperSetupStore((s) => s.setup);
  const markIntroSeen = useTamperSetupStore((s) => s.markIntroSeen);
  const entryStep = resolveWizardStep(setup);
  const [step, setStep] = useState<WizardStep>(entryStep);

  useEffect(() => {
    setStep(entryStep);
  }, [entryStep]);

  const onNext = (): void => setStep((current) => NEXT[current]);

  if (!BlockerBridge.capabilities.supportsTamperProtection) {
    return (
      <Screen padded={false} edges={['bottom']} edgeEffect="soft">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 60,
            paddingTop: 32,
            gap: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-3">
            <Typography variant="display-md" tone="ink">
              Protection setup is not available here.
            </Typography>
            <Typography variant="body" tone="muted">
              This device uses{' '}
              {BlockerBridge.capabilities.authorizationAccessName} for app
              blocking. The Screen Time lock-in defenses apply only on devices
              that support that protection model.
            </Typography>
          </View>
          <Card>
            <Button title="Done" variant="commit" onPress={onClose} />
          </Card>
        </ScrollView>
      </Screen>
    );
  }

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
