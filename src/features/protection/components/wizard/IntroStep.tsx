import { ScrollView, View } from 'react-native';
import { Button } from '../../../../shared/components/Button';
import { InfoBanner } from '../../../../shared/components/InfoBanner';
import { Screen } from '../../../../shared/components/Screen';
import { StepHeader } from '../../../../shared/components/StepHeader';
import { Typography } from '../../../../shared/components/Typography';
import { PROTECTION_WIZARD_STEPS, protectionCopy } from '../../copy';
import { HonestDisclosures } from '../HonestDisclosures';
import { PostureStatusPanel } from '../PostureStatusPanel';

interface IntroStepProps {
  readonly onNext: () => void;
  readonly onClose: () => void;
}

export function IntroStep({ onNext, onClose }: IntroStepProps): JSX.Element {
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
          step={1}
          total={PROTECTION_WIZARD_STEPS}
          title={protectionCopy.intro.title}
          onClose={onClose}
        />

        <Typography variant="body" tone="muted">
          {protectionCopy.intro.body}
        </Typography>

        <InfoBanner variant="info">
          {`${protectionCopy.intro.timeEstimate} ${protectionCopy.intro.iosVersionNote}`}
        </InfoBanner>

        <PostureStatusPanel />

        <HonestDisclosures title={protectionCopy.intro.cannotPreventTitle} />

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
      </ScrollView>
    </Screen>
  );
}
