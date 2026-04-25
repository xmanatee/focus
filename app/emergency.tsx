import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { protectionCopy } from '../src/features/protection/copy';
import type { EmergencyQuota } from '../src/features/protection/types';
import { useEmergencyQuota } from '../src/features/protection/useEmergencyQuota';
import { useEmergencyStore } from '../src/features/protection/useEmergencyStore';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { Button } from '../src/shared/components/Button';
import { CodeInput } from '../src/shared/components/CodeInput';
import { CodeReveal } from '../src/shared/components/CodeReveal';
import { CountdownPill } from '../src/shared/components/CountdownPill';
import { InfoBanner } from '../src/shared/components/InfoBanner';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';

export default function EmergencyExitScreen(): JSX.Element | null {
  const router = useRouter();
  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const forceDisable = useFocusBlockStore((s) => s.forceDisable);
  const consume = useEmergencyStore((s) => s.consume);

  const { active, now } = useActiveBlock(focusBlocks);
  const quota = useEmergencyQuota(now);

  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  useEffect(() => {
    if (active === null && revealed === null) router.back();
  }, [active, revealed, router]);

  if (active === null && revealed === null) return null;

  if (revealed !== null) {
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
          <Typography variant="display-md" tone="ink">
            {protectionCopy.emergencyModal.successTitle}
          </Typography>
          <InfoBanner
            variant="warn"
            title={protectionCopy.emergency.revealTitle}
          >
            {protectionCopy.emergencyModal.successBody}
          </InfoBanner>
          <CodeReveal value={revealed} />
          <Button
            title={protectionCopy.emergencyModal.successContinue}
            variant="commit"
            onPress={() => router.back()}
          />
        </ScrollView>
      </Screen>
    );
  }

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
        <Typography variant="display-md" tone="ink">
          {protectionCopy.emergencyModal.title}
        </Typography>

        <NotReady quota={quota} now={now} />

        {quota.kind === 'ready' && active !== null ? (
          <View className="gap-4">
            <Typography variant="body" tone="muted">
              {protectionCopy.emergencyModal.body}
            </Typography>
            <CodeInput
              length={quota.codeLength}
              value={value}
              onChange={setValue}
            />
            {errorMessage ? (
              <Typography variant="caption" tone="danger">
                {errorMessage}
              </Typography>
            ) : null}
            <Button
              title={protectionCopy.emergencyModal.confirm}
              variant="commit"
              disabled={value.length !== quota.codeLength}
              onPress={() => {
                const result = consume(value, new Date());
                if (!result.ok) {
                  void haptic.abandon();
                  setValue('');
                  setErrorMessage(protectionCopy.emergencyModal.wrong);
                  return;
                }
                void haptic.commit();
                forceDisable(active.id);
                setRevealed(result.nextCode);
              }}
            />
          </View>
        ) : (
          <Button
            title={protectionCopy.emergencyModal.close}
            variant="ghost"
            onPress={() => router.back()}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

function NotReady({
  quota,
  now,
}: {
  quota: EmergencyQuota;
  now: Date;
}): JSX.Element | null {
  if (quota.kind === 'ready') return null;
  if (quota.kind === 'disabled') {
    return (
      <InfoBanner variant="info">
        {protectionCopy.emergencyModal.notReadyDisabled}
      </InfoBanner>
    );
  }
  if (quota.kind === 'exhausted') {
    return (
      <InfoBanner
        variant="info"
        title={protectionCopy.emergencyModal.notReadyExhausted}
      >
        <CountdownPill target={quota.resetsAt} now={now} />
      </InfoBanner>
    );
  }
  return (
    <InfoBanner
      variant="info"
      title={protectionCopy.emergencyModal.notReadyCooldown}
    >
      <CountdownPill target={quota.unlocksAt} now={now} />
    </InfoBanner>
  );
}
