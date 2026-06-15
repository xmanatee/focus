import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useLocalDeviceId } from '../src/features/device/useLocalDeviceId';
import { useSetupActionHandler } from '../src/features/diagnostics/useSetupActionHandler';
import { useSetupVerification } from '../src/features/diagnostics/useSetupVerification';
import { QuickStartCard } from '../src/features/onboarding/QuickStartCard';
import { resolveQuickStartPhase } from '../src/features/onboarding/quickStart';
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

  const {
    isEnabledOnDevice: isSetupBlockEnabledOnDevice,
    state: adminState,
    now: adminNow,
  } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const setupBlock = useSettingsStore((s) => s.setupBlock);
  const setupBlockForThisDevice =
    setupBlock !== null && isSetupBlockEnabledOnDevice ? setupBlock : null;

  const posture = useProtectionPosture();
  const showProtectionCard = posture.score !== 'full';
  const setupVerification = useSetupVerification();
  const handleSetupAction = useSetupActionHandler();

  const quickStartPhase = resolveQuickStartPhase({
    authorizationStatus,
    applicableBlockCount: applicableBlocks.length,
    deviceId,
    missingDeviceSelectionCount,
  });

  useEffect(() => {
    if (!hasPermissions || deviceId === null) return;
    void reconcileFocusBlocks(runnableBlocks, setupBlockForThisDevice);
  }, [runnableBlocks, setupBlockForThisDevice, hasPermissions, deviceId]);

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
    if (quickStartPhase === 'prepareDevice') {
      router.push('/diagnostics');
      return;
    }
    if (quickStartPhase === 'createFirstBlock') {
      router.push('/add-focus-block');
      return;
    }
    if (quickStartPhase === 'finishDevice') {
      handleSetupAction('finishDeviceSetup');
    }
  };

  const progress = useMemo(
    () => buildFocusProgress(runnableBlocks, now),
    [runnableBlocks, now],
  );

  return (
    <Screen padded={false} edgeEffect="soft">
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
          {quickStartPhase !== null ? (
            <QuickStartCard
              phase={quickStartPhase}
              isPrimaryLoading={
                quickStartPhase === 'grantAccess' && busyState === 'authorizing'
              }
              onPrimary={handleQuickStartPrimary}
            />
          ) : null}

          <ReviewPromptCard verification={setupVerification} />

          <ProgressCard progress={progress} />

          {showProtectionCard && (
            <ProtectionStatusCard
              posture={posture}
              onPress={() => router.push('/protection')}
            />
          )}

          <LockInSettingsCard
            now={adminNow}
            state={adminState}
            setupBlock={setupBlock}
            onPress={() => router.push('/settings')}
          />
        </Section>

        <FocusBlockListSection
          applicableBlocks={applicableBlocks}
          deviceId={deviceId}
          isAdminLocked={isAdminLocked}
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
          onToggle={handleToggle}
        />
      </ScrollView>
    </Screen>
  );
}
