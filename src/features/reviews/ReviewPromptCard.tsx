import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Icon } from '../../shared/components/Icon';
import { Typography } from '../../shared/components/Typography';
import type { SetupVerification } from '../diagnostics/diagnostics';
import {
  type ReviewPromptState,
  markReviewPromptReviewed,
  parseReviewPromptState,
  serializeReviewPromptState,
  shouldShowReviewPrompt,
  snoozeReviewPrompt,
} from './reviewPromptState';

const REVIEW_PROMPT_STATE_KEY = 'focusblocks.reviewPrompt.state';
const APP_STORE_REVIEW_URL =
  'itms-apps://itunes.apple.com/app/id6763754394?action=write-review';

interface ReviewPromptCardProps {
  readonly verification: SetupVerification;
}

export function ReviewPromptCard({
  verification,
}: ReviewPromptCardProps): JSX.Element | null {
  const [promptState, setPromptState] = useState<ReviewPromptState | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;
    void AsyncStorage.getItem(REVIEW_PROMPT_STATE_KEY).then((value) => {
      if (isMounted) {
        setPromptState(parseReviewPromptState(value));
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (promptState === null) return null;

  const nowMs = Date.now();
  const shouldShow = shouldShowReviewPrompt(verification, promptState, nowMs);

  if (!shouldShow) return null;

  const saveState = (next: ReviewPromptState): void => {
    setPromptState(next);
    void AsyncStorage.setItem(
      REVIEW_PROMPT_STATE_KEY,
      serializeReviewPromptState(next),
    );
  };

  const dismiss = (): void => {
    saveState(snoozeReviewPrompt(nowMs));
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
            saveState(markReviewPromptReviewed(nowMs));
            void Linking.openURL(APP_STORE_REVIEW_URL);
          }}
        />
        <Button title="Not now" variant="ghost" onPress={dismiss} />
      </View>
    </Card>
  );
}
