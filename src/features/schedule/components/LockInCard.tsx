import { Card } from '../../../shared/components/Card';
import { InfoBanner } from '../../../shared/components/InfoBanner';
import { NotifyRow } from '../../../shared/components/NotifyRow';
import { Section } from '../../../shared/components/Section';
import { protectionCopy } from '../../protection/copy';

interface LockInCardProps {
  readonly value: boolean;
  readonly onChange: (next: boolean) => void;
  readonly tamperReady: boolean;
}

export function LockInCard({
  value,
  onChange,
  tamperReady,
}: LockInCardProps): JSX.Element {
  return (
    <Section title="Lock-in">
      <Card>
        <NotifyRow
          title={protectionCopy.lockInCard.title}
          subtitle={protectionCopy.lockInCard.body}
          value={value}
          onChange={onChange}
        />
        {!tamperReady ? (
          <InfoBanner variant="warn">
            {protectionCopy.lockInCard.needsSetup}
          </InfoBanner>
        ) : null}
      </Card>
    </Section>
  );
}
