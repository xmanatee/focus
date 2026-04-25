import { Button } from '../../../../shared/components/Button';
import { InfoBanner } from '../../../../shared/components/InfoBanner';
import { Typography } from '../../../../shared/components/Typography';
import { protectionCopy } from '../../copy';
import { PostureStatusPanel } from '../PostureStatusPanel';
import { WizardStepShell } from './WizardStepShell';

interface ConfirmStepProps {
  readonly onClose: () => void;
}

export function ConfirmStep({ onClose }: ConfirmStepProps): JSX.Element {
  return (
    <WizardStepShell
      step={4}
      title={protectionCopy.confirm.title}
      onClose={onClose}
    >
      <PostureStatusPanel />

      <Typography variant="body" tone="muted">
        {protectionCopy.confirm.body}
      </Typography>

      <InfoBanner variant="warn" title={protectionCopy.confirm.bypassTitle}>
        {protectionCopy.confirm.bypass}
      </InfoBanner>

      <Button
        title={protectionCopy.confirm.done}
        variant="commit"
        onPress={onClose}
      />
    </WizardStepShell>
  );
}
