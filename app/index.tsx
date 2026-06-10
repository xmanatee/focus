import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';
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
import { FocusBlockListSection } from '../src/features/schedule/components/FocusBlockListSection';
import { ProgressCard } from '../src/features/schedule/components/ProgressCard';
import { focusBlocksRunnableOnDevice } from '../src/features/schedule/deviceRuntime';
import { focusBlocksForDevice } from '../src/features/schedule/deviceScope';
import { focusBlockNeedsLocalSelection } from '../src/features/schedule/localActivitySelection';
import { buildFocusProgress } from '../src/features/schedule/progress';
import { reconcileFocusBlocks } from '../src/features/schedule/scheduler';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { LockInSettingsCard } from '../src/features/settings/components/LockInSettingsCard';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { ProtectionStatusCard } from '../src/shared/components/ProtectionStatusCard';
import { Screen } from '../src/shared/components/Screen';
import { Section } from '../src/shared/components/Section';
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
  const missingDeviceSelectionCount = useMemo(
    () =>
      applicableBlocks.filter((block) => focusBlockNeedsLocalSelection(block))
        .length,
    [applicableBlocks],
  );
  const runnableBlocks = useMemo(
    () => focusBlocksRunnableOnDevice(applicableBlocks, deviceId),
    [applicableBlocks, deviceId],
  );
  const { active, activeBlocks, now } = useActiveBlock(runnableBlocks);

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
    missingDeviceSelectionCount,
  });
  const quickStartVisiblePhase =
    quickStartPhase === 'complete' ? null : quickStartPhase;

  useEffect(() => {
    if (!hasPermissions || deviceId === null) return;
    void reconcileFocusBlocks(runnableBlocks, setupBlock);
  }, [runnableBlocks, setupBlock, hasPermissions, deviceId]);

  const handleGrant = async (): Promise<void> => {
    void haptic.commit();
    await requestPermissions();
  };

  const handleToggle = (blockId: string, nextIsEnabled: boolean): void => {
    if (deviceId === null) return;
    void haptic.select();
    toggleFocusBlock(blockId, deviceId, nextIsEnabled);
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
    () => buildFocusProgress(runnableBlocks, now),
    [runnableBlocks, now],
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

        <FocusBlockListSection
          applicableBlocks={applicableBlocks}
          deviceId={deviceId}
          isAdminLocked={isAdminLocked}
          missingDeviceSelectionCount={missingDeviceSelectionCount}
          now={now}
          onAdd={() => {
            void haptic.select();
            router.push('/add-focus-block');
          }}
          onEdit={(blockId) => {
            void haptic.select();
            router.push({
              pathname: '/add-focus-block',
              params: { id: blockId },
            });
          }}
          onFinishDeviceSetup={() => handleSetupAction('finishDeviceSetup')}
          onToggle={handleToggle}
        />
      </ScrollView>
    </Screen>
  );
}
