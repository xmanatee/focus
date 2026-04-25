import { View } from 'react-native';
import { InfoBanner } from '../../../shared/components/InfoBanner';
import { NotifyRow } from '../../../shared/components/NotifyRow';
import { Typography } from '../../../shared/components/Typography';
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
    <View className="gap-3">
      <Typography variant="label" tone="faint">
        Lock-in
      </Typography>
      <View className="bg-surface-raised rounded-3xl p-card gap-3 shadow-sm border border-divider/10">
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
      </View>
    </View>
  );
}
