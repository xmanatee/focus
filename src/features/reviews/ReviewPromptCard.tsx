import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Icon } from '../../shared/components/Icon';
import { Typography } from '../../shared/components/Typography';
import type { SetupVerification } from '../diagnostics/diagnostics';
import { shouldShowReviewPrompt } from './reviewEligibility';

const REVIEW_DISMISSED_KEY = 'focusblocks.reviewPrompt.dismissed';
const APP_STORE_REVIEW_URL =
  'itms-apps://itunes.apple.com/app/id6763754394?action=write-review';

interface ReviewPromptCardProps {
  readonly verification: SetupVerification;
}

export function ReviewPromptCard({
  verification,
}: ReviewPromptCardProps): JSX.Element | null {
  const [hasDismissed, setHasDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(REVIEW_DISMISSED_KEY).then(
      (value) => {
        if (isMounted) setHasDismissed(value === 'true');
      },
      () => {
        if (isMounted) setHasDismissed(true);
      },
    );
    return () => {
      isMounted = false;
    };
  }, []);

  if (hasDismissed === null) return null;

  const shouldShow = shouldShowReviewPrompt({
    activeBlockCount: verification.activeBlockCount,
    applicableBlockCount: verification.applicableBlockCount,
    hasDismissed,
    level: verification.level,
    missingDeviceSelectionCount: verification.missingDeviceSelectionCount,
  });

  if (!shouldShow) return null;

  const dismiss = (): void => {
    setHasDismissed(true);
    void AsyncStorage.setItem(REVIEW_DISMISSED_KEY, 'true');
  };

  return (
    <Card>
      <View className="flex-row items-center gap-3">
        <Icon name="star.fill" size={22} tone="signal" />
        <View className="flex-1 gap-1">
          <Typography variant="h3" tone="ink">
            Is Focus Blocks helping?
          </Typography>
          <Typography variant="body" tone="muted">
            A short App Store review makes the app easier for people to find.
          </Typography>
        </View>
      </View>
      <View className="gap-2">
        <Button
          title="Rate on App Store"
          variant="commit"
          onPress={() => {
            dismiss();
            void Linking.openURL(APP_STORE_REVIEW_URL);
          }}
        />
        <Button title="Not now" variant="ghost" onPress={dismiss} />
      </View>
    </Card>
  );
}
