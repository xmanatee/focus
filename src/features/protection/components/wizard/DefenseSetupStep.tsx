import * as Linking from 'expo-linking';
import type { ReactNode } from 'react';
import { Button } from '../../../../shared/components/Button';
import { Checklist } from '../../../../shared/components/Checklist';
import { Typography } from '../../../../shared/components/Typography';
import { haptic } from '../../../../shared/design/haptics';
import { protectionCopy } from '../../copy';
import type { DefenseId } from '../../types';
import { useTamperSetupStore } from '../../useTamperSetupStore';
import { WizardStepShell } from './WizardStepShell';

interface DefenseSetupStepProps {
  readonly defense: DefenseId;
  readonly step: number;
  readonly children?: ReactNode;
  readonly onNext: () => void;
  readonly onClose: () => void;
}

export function DefenseSetupStep({
  defense,
  step,
  children,
  onNext,
  onClose,
}: DefenseSetupStepProps): JSX.Element {
  const copy = protectionCopy[defense];
  const ack = useTamperSetupStore((s) => s.setup.acks[defense]);
  const toggle = useTamperSetupStore((s) => s.toggle);

  return (
    <WizardStepShell step={step} title={copy.title} onClose={onClose}>
      <Typography variant="body" tone="muted">
        {copy.body}
      </Typography>

      <Button
        title={copy.open}
        variant="commit"
        onPress={() => {
          void haptic.commit();
          void Linking.openSettings();
        }}
      />

      {children}

      <Checklist
        items={[{ id: defense, title: copy.confirm, status: ack.kind }]}
        onToggle={() => toggle(defense)}
      />

      <Button title={copy.continue} variant="commit" onPress={onNext} />
    </WizardStepShell>
  );
}
