import * as Linking from 'expo-linking';
import { ScrollView } from 'react-native';
import { Button } from '../../../../shared/components/Button';
import { Checklist } from '../../../../shared/components/Checklist';
import { InfoBanner } from '../../../../shared/components/InfoBanner';
import { Screen } from '../../../../shared/components/Screen';
import { StepHeader } from '../../../../shared/components/StepHeader';
import { Typography } from '../../../../shared/components/Typography';
import { haptic } from '../../../../shared/design/haptics';
import { PROTECTION_WIZARD_STEPS, protectionCopy } from '../../copy';
import { useTamperSetupStore } from '../../useTamperSetupStore';

interface PasscodeStepProps {
  readonly onNext: () => void;
  readonly onClose: () => void;
}

export function PasscodeStep({
  onNext,
  onClose,
}: PasscodeStepProps): JSX.Element {
  const passcodeAck = useTamperSetupStore((s) => s.setup.passcode);
  const toggle = useTamperSetupStore((s) => s.toggle);

  return (
    <Screen padded={false} edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: 60,
          gap: 20,
        }}
      >
        <StepHeader
          step={2}
          total={PROTECTION_WIZARD_STEPS}
          title={protectionCopy.passcode.title}
          onClose={onClose}
        />

        <Typography variant="body" tone="muted">
          {protectionCopy.passcode.body}
        </Typography>

        <Button
          title={protectionCopy.passcode.open}
          variant="commit"
          onPress={() => {
            void haptic.commit();
            void Linking.openSettings();
          }}
        />

        <InfoBanner
          variant="info"
          title={protectionCopy.passcode.trustedFriendTitle}
        >
          {protectionCopy.passcode.trustedFriendBody}
        </InfoBanner>

        <Checklist
          items={[
            {
              id: 'passcode',
              title: protectionCopy.passcode.confirm,
              status: passcodeAck.kind,
            },
          ]}
          onToggle={() => toggle('passcode')}
        />

        <Button
          title={protectionCopy.passcode.continue}
          variant="commit"
          onPress={onNext}
        />
      </ScrollView>
    </Screen>
  );
}
