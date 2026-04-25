import { View } from 'react-native';
import { InfoBanner } from '../../../shared/components/InfoBanner';
import { Typography } from '../../../shared/components/Typography';
import { protectionCopy } from '../copy';

interface HonestDisclosuresProps {
  readonly title: string;
}

export function HonestDisclosures({
  title,
}: HonestDisclosuresProps): JSX.Element {
  return (
    <InfoBanner variant="warn" title={title}>
      <View className="gap-1">
        {protectionCopy.intro.cannotPrevent.map((line) => (
          <Typography key={line} variant="caption" tone="muted">
            · {line}
          </Typography>
        ))}
      </View>
    </InfoBanner>
  );
}
