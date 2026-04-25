import * as Linking from 'expo-linking';
import { ScrollView } from 'react-native';
import { Button } from '../../../../shared/components/Button';
import { Checklist } from '../../../../shared/components/Checklist';
import { Screen } from '../../../../shared/components/Screen';
import { StepHeader } from '../../../../shared/components/StepHeader';
import { Typography } from '../../../../shared/components/Typography';
import { haptic } from '../../../../shared/design/haptics';
import { PROTECTION_WIZARD_STEPS, protectionCopy } from '../../copy';
import type { DefenseId } from '../../types';
import { useTamperSetupStore } from '../../useTamperSetupStore';

interface RestrictionsStepProps {
  readonly onNext: () => void;
  readonly onClose: () => void;
}

export function RestrictionsStep({
  onNext,
  onClose,
}: RestrictionsStepProps): JSX.Element {
  const setup = useTamperSetupStore((s) => s.setup);
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
          title={protectionCopy.restrictions.title}
          onClose={onClose}
        />

        <Typography variant="body" tone="muted">
          {protectionCopy.restrictions.body}
        </Typography>

        <Button
          title={protectionCopy.restrictions.open}
          variant="commit"
          onPress={() => {
            void haptic.commit();
            void Linking.openSettings();
          }}
        />

        <Checklist
          items={[
            {
              id: 'deleteLock',
              title: protectionCopy.restrictions.deleteConfirm,
              status: setup.deleteLock.kind,
            },
            {
              id: 'installLock',
              title: protectionCopy.restrictions.installConfirm,
              status: setup.installLock.kind,
            },
          ]}
          onToggle={(id) => toggle(id as DefenseId)}
        />

        <Button
          title={protectionCopy.restrictions.continue}
          variant="commit"
          onPress={onNext}
        />
      </ScrollView>
    </Screen>
  );
}
