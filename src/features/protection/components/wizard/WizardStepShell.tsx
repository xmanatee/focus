import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { Screen } from '../../../../shared/components/Screen';
import { StepHeader } from '../../../../shared/components/StepHeader';
import { PROTECTION_WIZARD_STEPS } from '../../copy';

interface WizardStepShellProps {
  readonly step: number;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

export function WizardStepShell({
  step,
  title,
  onClose,
  children,
}: WizardStepShellProps): JSX.Element {
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
          step={step}
          total={PROTECTION_WIZARD_STEPS}
          title={title}
          onClose={onClose}
        />
        {children}
      </ScrollView>
    </Screen>
  );
}
