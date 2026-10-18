import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { BlockerBridge } from '../src/bridge/BlockerBridge';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useSetupActionHandler } from '../src/features/diagnostics/useSetupActionHandler';
import { useSetupVerification } from '../src/features/diagnostics/useSetupVerification';
import { QuickStartCard } from '../src/features/onboarding/QuickStartCard';
import { resolveQuickStartPhase } from '../src/features/onboarding/quickStart';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import { ReviewPromptCard } from '../src/features/reviews/ReviewPromptCard';
import { ActiveSessionCard } from '../src/features/schedule/components/ActiveSessionCard';
import { FocusBlockListSection } from '../src/features/schedule/components/FocusBlockListSection';
import { ProgressCard } from '../src/features/schedule/components/ProgressCard';
import { SchedulerErrorCard } from '../src/features/schedule/components/SchedulerErrorCard';
import { focusBlocksRunnableLocally } from '../src/features/schedule/localRuntime';
import { buildFocusProgress } from '../src/features/schedule/progress';
import { missingRuntimeAccess } from '../src/features/schedule/runtimeAccess';
import { assertRuntimeCapacity } from '../src/features/schedule/runtimeCapacity';
import { reconcileFocusBlocks } from '../src/features/schedule/scheduler';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useBlockActivationStore } from '../src/features/schedule/useBlockActivationStore';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { LockInSettingsCard } from '../src/features/settings/components/LockInSettingsCard';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { ProtectionStatusCard } from '../src/shared/components/ProtectionStatusCard';
import { Screen } from '../src/shared/components/Screen';
import { Section } from '../src/shared/components/Section';
import { haptic } from '../src/shared/design/haptics';
import { errorMessage } from '../src/shared/errors';

export default function MainFeedScreen(): React.JSX.Element {
  const router = useRouter();
  const access = useBlockerStore((s) => s.access);
  const authorization = access.authorization;
  const busyState = useBlockerStore((s) => s.busyState);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);
  const requestRuntimePermissions = useBlockerStore(
    (s) => s.requestRuntimePermissions,
  );
  const hasPermissions = authorization.status === 'authorized';

  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const enabledBlockIds = useBlockActivationStore((s) => s.enabledBlockIds);
  const setBlockEnabled = useBlockActivationStore((s) => s.setBlockEnabled);
  const runnableBlocks = useMemo(
    () =>
      focusBlocksRunnableLocally(
        focusBlocks,
        enabledBlockIds,
        access.runtimeAccess,
      ),
    [access.runtimeAccess, enabledBlockIds, focusBlocks],
  );
  const { active, activeBlocks, now } = useActiveBlock(runnableBlocks);

  const {
    isEnabledOnDevice: isSetupBlockEnabledOnDevice,
    state: adminState,
    now: adminNow,
  } = useAdminState();
  const supportsSystemTamperProtection =
    BlockerBridge.capabilities.supportsSystemTamperProtection;
  const canReconcileRuntime =
    hasPermissions ||
    BlockerBridge.capabilities.canReconcileWithoutAuthorization;
  const isAdminLocked = adminState.kind === 'locked';
  const setupBlock = useSettingsStore((s) => s.setupBlock);
  const setupBlockForThisDevice =
    setupBlock !== null && isSetupBlockEnabledOnDevice ? setupBlock : null;

  const posture = useProtectionPosture();
  const showProtectionCard =
    supportsSystemTamperProtection && posture.score !== 'full';
  const setupVerification = useSetupVerification();
  const handleSetupAction = useSetupActionHandler();
  const [schedulerError, setSchedulerError] = useState<string | null>(null);

  const quickStartPhase = resolveQuickStartPhase({
    authorization,
    blockCount: focusBlocks.length,
    missingDeviceSelectionCount: setupVerification.missingDeviceSelectionCount,
    missingRuntimeAccessCount: setupVerification.missingRuntimeAccessCount,
  });
  const showAdvancedConfiguration = quickStartPhase === null;

  useEffect(() => {
    if (!canReconcileRuntime) {
      setSchedulerError(null);
      return;
    }

    let isCurrent = true;
    async function reconcile(): Promise<void> {
      try {
        await reconcileFocusBlocks(runnableBlocks, setupBlockForThisDevice);
        if (isCurrent) setSchedulerError(null);
      } catch (caught) {
        if (isCurrent) {
          setSchedulerError(errorMessage(caught));
        }
      }
    }

    void reconcile();
    return () => {
      isCurrent = false;
    };
  }, [runnableBlocks, setupBlockForThisDevice, canReconcileRuntime]);

  const handleGrant = async (): Promise<void> => {
    void haptic.commit();
    await requestPermissions();
  };

  const handleToggle = async (
    blockId: string,
    nextIsEnabled: boolean,
  ): Promise<void> => {
    if (nextIsEnabled) {
      const block = focusBlocks.find((item) => item.id === blockId);
      if (block === undefined) {
        setSchedulerError('Focus block not found.');
        return;
      }
      for (const kind of missingRuntimeAccess(block, access.runtimeAccess)) {
        const granted = await requestRuntimePermissions(kind);
        if (!granted) {
          setSchedulerError(
            kind === 'dailyBudgets'
              ? 'Usage Access is required for this budget.'
              : 'Local VPN access is required for website blocking.',
          );
          return;
        }
      }
      const nextEnabledBlockIds = [
        ...enabledBlockIds.filter((id) => id !== blockId),
        blockId,
      ];
      try {
        assertRuntimeCapacity(
          focusBlocksRunnableLocally(
            focusBlocks,
            nextEnabledBlockIds,
            useBlockerStore.getState().access.runtimeAccess,
          ),
          setupBlockForThisDevice,
        );
      } catch (error) {
        setSchedulerError(errorMessage(error));
        return;
      }
    }
    void haptic.select();
    setSchedulerError(null);
    setBlockEnabled(blockId, nextIsEnabled);
  };

  const handleQuickStartPrimary = (): void => {
    if (
      quickStartPhase === 'prepareRestrictedSettings' ||
      quickStartPhase === 'grantAccess'
    ) {
      void handleGrant();
      return;
    }
    void haptic.select();
    if (quickStartPhase === 'openSettings') {
      handleSetupAction('requestBlockingAccess');
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
  const showConfigurationSection =
    quickStartPhase !== null ||
    schedulerError !== null ||
    (showAdvancedConfiguration &&
      (progress.enabledBlockCount > 0 ||
        showProtectionCard ||
        setupBlock !== null));

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

        {showConfigurationSection ? (
          <Section title="Configuration">
            {quickStartPhase !== null ? (
              <QuickStartCard
                phase={quickStartPhase}
                isPrimaryLoading={
                  (quickStartPhase === 'prepareRestrictedSettings' ||
                    quickStartPhase === 'grantAccess') &&
                  busyState === 'authorization'
                }
                onPrimary={handleQuickStartPrimary}
              />
            ) : null}

            {showAdvancedConfiguration ? (
              <ReviewPromptCard
                completedScheduledWindowCount={
                  progress.completedScheduledWindowCount
                }
                verification={setupVerification}
              />
            ) : null}

            {schedulerError !== null ? (
              <SchedulerErrorCard message={schedulerError} />
            ) : null}

            {showAdvancedConfiguration ? (
              <ProgressCard progress={progress} />
            ) : null}

            {showAdvancedConfiguration && showProtectionCard ? (
              <ProtectionStatusCard
                posture={posture}
                onPress={() => router.push('/protection')}
              />
            ) : null}

            {showAdvancedConfiguration || isAdminLocked ? (
              <LockInSettingsCard
                now={adminNow}
                state={adminState}
                setupBlock={setupBlock}
                onPress={() => router.push('/settings')}
              />
            ) : null}
          </Section>
        ) : null}

        {focusBlocks.length > 0 || quickStartPhase === null ? (
          <FocusBlockListSection
            focusBlocks={focusBlocks}
            hasBlockingAccess={hasPermissions}
            enabledBlockIds={enabledBlockIds}
            isAdminLocked={isAdminLocked}
            now={now}
            runtimeAccess={access.runtimeAccess}
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
        ) : null}
      </ScrollView>
    </Screen>
  );
}
