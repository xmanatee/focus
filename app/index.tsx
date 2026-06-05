import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ScreenTimeAccessCard } from '../src/features/blocker/components/ScreenTimeAccessCard';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useLocalDeviceId } from '../src/features/device/useLocalDeviceId';
import { SetupVerificationCard } from '../src/features/diagnostics/components/SetupVerificationCard';
import { useSetupActionHandler } from '../src/features/diagnostics/useSetupActionHandler';
import { useSetupVerification } from '../src/features/diagnostics/useSetupVerification';
import { QuickStartCard } from '../src/features/onboarding/QuickStartCard';
import { resolveQuickStartPhase } from '../src/features/onboarding/quickStart';
import { useQuickStartStore } from '../src/features/onboarding/useQuickStartStore';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import { ReviewPromptCard } from '../src/features/reviews/ReviewPromptCard';
import { ActiveSessionCard } from '../src/features/schedule/components/ActiveSessionCard';
import { FocusBlockRow } from '../src/features/schedule/components/FocusBlockRow';
import { ProgressCard } from '../src/features/schedule/components/ProgressCard';
import { focusBlocksForDevice } from '../src/features/schedule/deviceScope';
import { focusBlockNeedsLocalSelection } from '../src/features/schedule/localActivitySelection';
import { buildFocusProgress } from '../src/features/schedule/progress';
import { getFocusBlockRuntimeStatus } from '../src/features/schedule/runtimeStatus';
import { reconcileFocusBlocks } from '../src/features/schedule/scheduler';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { LockInSettingsCard } from '../src/features/settings/components/LockInSettingsCard';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { Button } from '../src/shared/components/Button';
import { Card } from '../src/shared/components/Card';
import { Icon } from '../src/shared/components/Icon';
import { ProtectionStatusCard } from '../src/shared/components/ProtectionStatusCard';
import { Screen } from '../src/shared/components/Screen';
import { Section } from '../src/shared/components/Section';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';

export default function MainFeedScreen(): JSX.Element {
  const router = useRouter();
  const authorizationStatus = useBlockerStore((s) => s.authorizationStatus);
  const busyState = useBlockerStore((s) => s.busyState);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);
  const hasPermissions = authorizationStatus === 'authorized';
  const permissionsDenied = authorizationStatus === 'denied';

  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const toggleFocusBlock = useFocusBlockStore((s) => s.toggleFocusBlock);
  const deviceId = useLocalDeviceId();
  const applicableBlocks = useMemo(
    () => focusBlocksForDevice(focusBlocks, deviceId),
    [focusBlocks, deviceId],
  );
  const blocksNeedingDeviceSelection = useMemo(
    () =>
      applicableBlocks.filter((block) => focusBlockNeedsLocalSelection(block)),
    [applicableBlocks],
  );
  const { active, activeBlocks, now } = useActiveBlock(applicableBlocks);

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const setupBlock = useSettingsStore((s) => s.setupBlock);

  const posture = useProtectionPosture();
  const showProtectionCard = posture.score !== 'full';
  const setupVerification = useSetupVerification();
  const handleSetupAction = useSetupActionHandler();
  const hasCompletedQuickStart = useQuickStartStore(
    (s) => s.hasCompletedQuickStart,
  );
  const completeQuickStart = useQuickStartStore((s) => s.completeQuickStart);

  const quickStartPhase = resolveQuickStartPhase({
    authorizationStatus,
    blockCount: applicableBlocks.length,
    hasCompletedQuickStart,
    missingDeviceSelectionCount: blocksNeedingDeviceSelection.length,
  });
  const quickStartVisiblePhase =
    quickStartPhase === 'complete' ? null : quickStartPhase;

  useEffect(() => {
    if (!hasPermissions || deviceId === null) return;
    void reconcileFocusBlocks(applicableBlocks, setupBlock);
  }, [applicableBlocks, setupBlock, hasPermissions, deviceId]);

  const handleGrant = async (): Promise<void> => {
    void haptic.commit();
    await requestPermissions();
  };

  const handleToggle = (blockId: string, nextIsEnabled: boolean): void => {
    void haptic.select();
    toggleFocusBlock(blockId, nextIsEnabled);
  };

  const handleQuickStartPrimary = (): void => {
    if (quickStartPhase === 'grantAccess') {
      void handleGrant();
      return;
    }
    void haptic.select();
    if (quickStartPhase === 'openSettings') {
      handleSetupAction('requestScreenTime');
      return;
    }
    if (quickStartPhase === 'createFirstBlock') {
      router.push('/add-focus-block');
      return;
    }
    if (quickStartPhase === 'finishDevice') {
      handleSetupAction('finishDeviceSetup');
      return;
    }
    if (quickStartPhase === 'verifySetup') {
      router.push('/diagnostics');
    }
  };

  const progress = useMemo(
    () => buildFocusProgress(applicableBlocks, now),
    [applicableBlocks, now],
  );

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 40,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {active && (
          <ActiveSessionCard
            status={active}
            extraStatuses={activeBlocks.slice(1)}
            now={now}
          />
        )}

        <Section title="Configuration">
          {quickStartVisiblePhase !== null ? (
            <QuickStartCard
              phase={quickStartVisiblePhase}
              onPrimary={handleQuickStartPrimary}
              onComplete={() => {
                void haptic.commit();
                completeQuickStart();
              }}
            />
          ) : permissionsDenied ? (
            <ScreenTimeAccessCard
              denied
              isAuthorizing={false}
              onGrant={() => void handleGrant()}
              onOpenSettings={() => {
                void haptic.select();
                handleSetupAction('requestScreenTime');
              }}
            />
          ) : !hasPermissions ? (
            <ScreenTimeAccessCard
              denied={false}
              isAuthorizing={busyState === 'authorizing'}
              onGrant={() => void handleGrant()}
              onOpenSettings={() => {
                void haptic.select();
                handleSetupAction('requestScreenTime');
              }}
            />
          ) : null}

          <SetupVerificationCard
            verification={setupVerification}
            onAction={handleSetupAction}
            onOpenDetails={() => router.push('/diagnostics')}
          />

          <ReviewPromptCard verification={setupVerification} />

          <ProgressCard progress={progress} />

          {showProtectionCard && (
            <ProtectionStatusCard
              posture={posture}
              onPress={() => router.push('/protection')}
            />
          )}

          <LockInSettingsCard
            isAdminLocked={isAdminLocked}
            setupBlock={setupBlock}
            onPress={() => router.push('/settings')}
          />
        </Section>

        <Section
          title="Focus Blocks"
          action={
            <Pressable
              onPress={() => {
                void haptic.select();
                router.push('/add-focus-block');
              }}
              className="h-10 w-10 items-center justify-center rounded-full bg-signal"
            >
              <Icon name="plus" size={20} tone="surface" />
            </Pressable>
          }
        >
          {applicableBlocks.length === 0 ? (
            <Card tone="dashed" className="py-10 items-center">
              <Icon name="sparkles" size={24} tone="signal" />
              <Typography variant="h3" tone="ink" align="center">
                Start with a template.
              </Typography>
              <Typography variant="body" tone="muted" align="center">
                Deep Work, Study Focus, Social Budget, and YouTube Limit are
                ready on the next screen.
              </Typography>
              <Button
                title="Add a block"
                variant="commit"
                onPress={() => router.push('/add-focus-block')}
              />
            </Card>
          ) : (
            <>
              {blocksNeedingDeviceSelection.length > 0 && (
                <Card tone="signal">
                  <View className="flex-row items-center gap-2">
                    <Icon
                      name="iphone.gen3.radiowaves.left.and.right"
                      size={22}
                      tone="signal"
                    />
                    <Typography variant="h3" tone="signal">
                      Confirm apps on this device
                    </Typography>
                  </View>
                  <Typography variant="body" tone="ink">
                    iCloud synced the rules, but iOS app selections are private
                    to each device. Open each block marked "Pick apps here" and
                    choose the apps for this iPhone.
                  </Typography>
                  <Button
                    title="Finish this device"
                    variant="commit"
                    onPress={() => handleSetupAction('finishDeviceSetup')}
                  />
                </Card>
              )}
              {applicableBlocks.map((block) => {
                const status = getFocusBlockRuntimeStatus(block, now);
                const isActive = status.kind === 'active';
                const needsDeviceSelection = blocksNeedingDeviceSelection.some(
                  (item) => item.id === block.id,
                );
                return (
                  <FocusBlockRow
                    key={block.id}
                    block={block}
                    isActive={isActive}
                    needsDeviceSelection={needsDeviceSelection}
                    toggleDisabled={isActive || isAdminLocked}
                    onPress={() => {
                      void haptic.select();
                      router.push({
                        pathname: '/add-focus-block',
                        params: { id: block.id },
                      });
                    }}
                    onToggle={(next) => handleToggle(block.id, next)}
                  />
                );
              })}
            </>
          )}
        </Section>
      </ScrollView>
    </Screen>
  );
}
