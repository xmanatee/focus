import { ScrollView } from 'react-native';
import { Button } from '../../../../shared/components/Button';
import { Screen } from '../../../../shared/components/Screen';
import { StepHeader } from '../../../../shared/components/StepHeader';
import { PROTECTION_WIZARD_STEPS, protectionCopy } from '../../copy';
import { HonestDisclosures } from '../HonestDisclosures';
import { PostureStatusPanel } from '../PostureStatusPanel';

interface ConfirmStepProps {
  readonly onClose: () => void;
}

export function ConfirmStep({ onClose }: ConfirmStepProps): JSX.Element {
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
          step={5}
          total={PROTECTION_WIZARD_STEPS}
          title={protectionCopy.confirm.title}
          onClose={onClose}
        />

        <PostureStatusPanel />

        <HonestDisclosures title={protectionCopy.confirm.cannotPreventTitle} />

        <Button
          title={protectionCopy.confirm.done}
          variant="commit"
          onPress={onClose}
        />
      </ScrollView>
    </Screen>
  );
}
