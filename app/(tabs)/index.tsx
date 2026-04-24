import { useAuthActions } from '@convex-dev/auth/react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
import { Button } from '../../src/shared/components/Button';
import { HairlineBar } from '../../src/shared/components/HairlineBar';
import { Icon } from '../../src/shared/components/Icon';
import { Screen } from '../../src/shared/components/Screen';
import { Typography } from '../../src/shared/components/Typography';
import { haptic } from '../../src/shared/design/haptics';
import { useAsyncAction } from '../../src/shared/hooks/useAsyncAction';
import {
  formatCountdown,
  useSessionCountdown,
} from '../../src/shared/hooks/useSessionCountdown';

const DURATION_PRESETS: readonly { label: string; seconds: number }[] = [
  { label: '10', seconds: 10 * 60 },
  { label: '25', seconds: 25 * 60 },
  { label: '50', seconds: 50 * 60 },
  { label: '90', seconds: 90 * 60 },
];

export default function DashboardScreen(): JSX.Element {
  const { signOut } = useAuthActions();
  const router = useRouter();

  const isActive = useBlockerStore((s) => s.isActive);
  const hasPermissions = useBlockerStore((s) => s.hasPermissions);
  const busyState = useBlockerStore((s) => s.busyState);
  const activitySelection = useBlockerStore(
    (s) => s.selection.activitySelection,
  );
  const hasApps = useBlockerStore(
    (s) =>
      s.selection.activitySelection.status === 'saved' ||
      s.selection.webDomains.length > 0,
  );
  const sessionStartedAt = useBlockerStore((s) => s.sessionStartedAt);
  const sessionDurationSec = useBlockerStore((s) => s.sessionDurationSec);
  const setBlockerEnabled = useBlockerStore((s) => s.setBlockerEnabled);
  const setSessionDuration = useBlockerStore((s) => s.setSessionDuration);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);

  const { error, run } = useAsyncAction();
  const { secondsRemaining, progress } = useSessionCountdown(
    sessionStartedAt,
    sessionDurationSec,
  );

  const handleGrant = (): Promise<boolean> =>
    run(async () => {
      void haptic.commit();
      const granted = await requestPermissions();
      if (!granted) {
        throw new Error('Screen Time permission was not granted.');
      }
    }, 'Could not request Screen Time permission.');

  const handleBegin = (): Promise<boolean> =>
    run(async () => {
      void haptic.commit();
      await setBlockerEnabled(true);
    }, 'Could not begin session.');

  const handleAbandon = (): Promise<boolean> =>
    run(async () => {
      void haptic.abandon();
      await setBlockerEnabled(false);
    }, 'Could not end session.');

  const handlePickDuration = (seconds: number): void => {
    if (seconds === sessionDurationSec) {
      return;
    }
    void haptic.select();
    setSessionDuration(seconds);
  };

  if (!hasPermissions) {
    return (
      <Screen>
        <TopBar onSignOut={() => void signOut()} />
        <View className="flex-1 justify-center gap-4">
          <Typography variant="label" tone="signal">
            Before you begin
          </Typography>
          <Typography variant="display-md" tone="ink">
            Grant Screen Time access.
          </Typography>
          <Typography variant="body" tone="muted" className="max-w-[340px]">
            Fucus blocks apps and sites on your device using Apple&apos;s Family
            Controls. Nothing leaves your phone.
          </Typography>
          <View className="mt-4">
            <Button
              title="Grant access"
              variant="commit"
              onPress={() => void handleGrant()}
              isLoading={busyState === 'authorizing'}
              disabled={busyState !== 'idle'}
            />
          </View>
          {error ? <ErrorLine text={error} /> : null}
        </View>
      </Screen>
    );
  }

  if (isActive) {
    return (
      <Screen tone="sunken">
        <Animated.View
          entering={FadeIn.duration(420)}
          exiting={FadeOut.duration(280)}
          className="flex-1 justify-between py-8"
        >
          <View>
            <Typography variant="label" tone="signal" align="center">
              In session
            </Typography>
          </View>

          <View className="items-center gap-6">
            <Typography variant="display-xl" tone="ink" align="center" numeric>
              {formatCountdown(secondsRemaining)}
            </Typography>
            <View className="w-full px-4">
              <HairlineBar progress={1 - progress} />
            </View>
          </View>

          <View className="gap-3">
            <Button
              title="Abandon"
              variant="abandon"
              onPress={() => void handleAbandon()}
              isLoading={busyState === 'syncing'}
              disabled={busyState !== 'idle'}
            />
            {error ? <ErrorLine text={error} /> : null}
          </View>
        </Animated.View>
      </Screen>
    );
  }

  const activeLabel =
    activitySelection.status === 'saved'
      ? `${
          activitySelection.applicationCount + activitySelection.categoryCount
        } picked`
      : 'Nothing picked';

  return (
    <Screen>
      <TopBar onSignOut={() => void signOut()} />
      <View className="flex-1 justify-between py-4">
        <View className="gap-2">
          <Typography variant="label" tone="muted">
            Ready when you are
          </Typography>
          <Typography variant="display-md" tone="ink">
            Pick a window.
          </Typography>
        </View>

        <View className="items-center gap-8">
          <Typography variant="display-xl" tone="ink" align="center" numeric>
            {formatCountdown(sessionDurationSec)}
          </Typography>
          <View className="flex-row gap-2">
            {DURATION_PRESETS.map((preset) => {
              const selected = preset.seconds === sessionDurationSec;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => handlePickDuration(preset.seconds)}
                  className={`px-4 py-2 rounded-lg border ${
                    selected
                      ? 'bg-signal border-signal'
                      : 'bg-transparent border-divider'
                  }`}
                >
                  <Typography
                    variant="body-md"
                    tone={selected ? 'ink' : 'muted'}
                    className={selected ? 'text-surface' : ''}
                  >
                    {preset.label}m
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between px-1">
            <Typography variant="caption" tone="muted">
              Blocking {activeLabel}
            </Typography>
            <Pressable
              onPress={() => router.push('/select-apps')}
              className="flex-row items-center gap-1"
            >
              <Typography variant="caption" tone="ink">
                Edit
              </Typography>
              <Icon name="chevron.right" size={12} tone="ink" />
            </Pressable>
          </View>
          <Button
            title="Begin"
            variant="commit"
            onPress={() => void handleBegin()}
            isLoading={busyState === 'syncing'}
            disabled={busyState !== 'idle' || !hasApps}
          />
          {!hasApps ? (
            <Typography
              variant="caption"
              tone="faint"
              align="center"
              className="mt-1"
            >
              Pick at least one app or site to block first.
            </Typography>
          ) : null}
          {error ? <ErrorLine text={error} /> : null}
        </View>
      </View>
    </Screen>
  );
}

function TopBar({ onSignOut }: { onSignOut: () => void }): JSX.Element {
  return (
    <View className="flex-row justify-between items-center py-3">
      <Typography variant="label" tone="signal">
        Fucus
      </Typography>
      <Pressable
        onPress={onSignOut}
        className="h-10 w-10 items-center justify-center rounded-full"
        accessibilityLabel="Sign out"
      >
        <Icon name="person.crop.circle" size={24} tone="muted" />
      </Pressable>
    </View>
  );
}

function ErrorLine({ text }: { text: string }): JSX.Element {
  return (
    <Typography variant="caption" tone="danger" align="center" className="mt-1">
      {text}
    </Typography>
  );
}
