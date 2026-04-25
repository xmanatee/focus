import { Card } from '../../../shared/components/Card';
import { InfoBanner } from '../../../shared/components/InfoBanner';
import { NotifyRow } from '../../../shared/components/NotifyRow';
import { Section } from '../../../shared/components/Section';
import { protectionCopy } from '../../protection/copy';

interface StrictModeCardProps {
  readonly value: boolean;
  readonly onChange: (next: boolean) => void;
  readonly tamperReady: boolean;
  readonly disabled?: boolean;
}

export function StrictModeCard({
  value,
  onChange,
  tamperReady,
  disabled = false,
}: StrictModeCardProps): JSX.Element {
  return (
    <Section title={protectionCopy.strictMode.title}>
      <Card>
        <NotifyRow
          title={protectionCopy.strictMode.title}
          subtitle={protectionCopy.strictMode.body}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        {!tamperReady ? (
          <InfoBanner variant="warn">
            {protectionCopy.strictMode.needsSetup}
          </InfoBanner>
        ) : null}
      </Card>
    </Section>
  );
}
