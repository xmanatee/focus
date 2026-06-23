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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPromptState(): Promise<void> {
      try {
        const value = await AsyncStorage.getItem(REVIEW_PROMPT_STATE_KEY);
        if (!isMounted) return;
        setPromptState(parseReviewPromptState(value));
      } catch (caught) {
        if (!isMounted) return;
        setError(formatError(caught));
        setPromptState(parseReviewPromptState(null));
      }
    }
    void loadPromptState();
    return () => {
      isMounted = false;
    };
  }, []);

  if (promptState === null) return null;

  const nowMs = Date.now();
  const shouldShow = shouldShowReviewPrompt(verification, promptState, nowMs);

  if (!shouldShow) return null;

  const saveState = async (next: ReviewPromptState): Promise<void> => {
    setPromptState(next);
    try {
      await AsyncStorage.setItem(
        REVIEW_PROMPT_STATE_KEY,
        serializeReviewPromptState(next),
      );
      setError(null);
    } catch (caught) {
      setError(formatError(caught));
    }
  };

  const dismiss = (): void => {
    void saveState(snoozeReviewPrompt(nowMs));
  };

  const rate = async (): Promise<void> => {
    await saveState(markReviewPromptReviewed(nowMs));
    try {
      await Linking.openURL(APP_STORE_REVIEW_URL);
    } catch (caught) {
      setError(formatError(caught));
    }
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
          onPress={() => void rate()}
        />
        <Button title="Not now" variant="ghost" onPress={dismiss} />
      </View>
      {error !== null ? (
        <Typography variant="caption" tone="danger">
          {error}
        </Typography>
      ) : null}
    </Card>
  );
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
