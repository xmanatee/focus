import * as Linking from 'expo-linking';
import { ScrollView } from 'react-native';
import { Button } from '../../../../shared/components/Button';
import { Checklist } from '../../../../shared/components/Checklist';
import { Screen } from '../../../../shared/components/Screen';
import { StepHeader } from '../../../../shared/components/StepHeader';
import { Typography } from '../../../../shared/components/Typography';
import { haptic } from '../../../../shared/design/haptics';
import { PROTECTION_WIZARD_STEPS, protectionCopy } from '../../copy';
import { useTamperSetupStore } from '../../useTamperSetupStore';

interface AppDeletionStepProps {
  readonly onNext: () => void;
  readonly onClose: () => void;
}

export function AppDeletionStep({
  onNext,
  onClose,
}: AppDeletionStepProps): JSX.Element {
  const ack = useTamperSetupStore((s) => s.setup.acks.appDeletion);
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
          step={3}
          total={PROTECTION_WIZARD_STEPS}
          title={protectionCopy.appDeletion.title}
          onClose={onClose}
        />

        <Typography variant="body" tone="muted">
          {protectionCopy.appDeletion.body}
        </Typography>

        <Button
          title={protectionCopy.appDeletion.open}
          variant="commit"
          onPress={() => {
            void haptic.commit();
            void Linking.openSettings();
          }}
        />

        <Checklist
          items={[
            {
              id: 'appDeletion',
              title: protectionCopy.appDeletion.confirm,
              status: ack.kind,
            },
          ]}
          onToggle={() => toggle('appDeletion')}
        />

        <Button
          title={protectionCopy.appDeletion.continue}
          variant="commit"
          onPress={onNext}
        />
      </ScrollView>
    </Screen>
  );
}
