import { View } from 'react-native';
import { Button } from '../../../../shared/components/Button';
import { InfoBanner } from '../../../../shared/components/InfoBanner';
import { Typography } from '../../../../shared/components/Typography';
import { protectionCopy } from '../../copy';
import { PostureStatusPanel } from '../PostureStatusPanel';
import { WizardStepShell } from './WizardStepShell';

interface IntroStepProps {
  readonly onNext: () => void;
  readonly onClose: () => void;
}

export function IntroStep({ onNext, onClose }: IntroStepProps): JSX.Element {
  return (
    <WizardStepShell
      step={1}
      title={protectionCopy.intro.title}
      onClose={onClose}
    >
      <Typography variant="body" tone="muted">
        {protectionCopy.intro.body}
      </Typography>

      <InfoBanner variant="info">
        {protectionCopy.intro.timeEstimate}
      </InfoBanner>

      <PostureStatusPanel />

      <View className="gap-2 pt-2">
        <Button
          title={protectionCopy.intro.primary}
          variant="commit"
          onPress={onNext}
        />
        <Button
          title={protectionCopy.intro.skip}
          variant="ghost"
          onPress={onClose}
        />
      </View>
    </WizardStepShell>
  );
}
