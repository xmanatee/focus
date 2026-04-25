import { Card } from '../../../shared/components/Card';
import { DefenseDotsRow } from '../../../shared/components/DefenseDotsRow';
import { Typography } from '../../../shared/components/Typography';
import { useProtectionPosture } from '../useProtectionPosture';

export function PostureStatusPanel(): JSX.Element {
  const posture = useProtectionPosture();
  return (
    <Card>
      <Typography variant="label" tone="faint">
        Status
      </Typography>
      <DefenseDotsRow defenses={posture.defenses} />
    </Card>
  );
}
