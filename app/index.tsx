import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { isSlotPopulated } from '../src/features/blocker/selectionSlot';
import {
  hasSavedActivitySelection,
  selectionIdForBlock,
} from '../src/features/blocker/types';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useLocalDeviceId } from '../src/features/device/useLocalDeviceId';
import { SetupVerificationCard } from '../src/features/diagnostics/components/SetupVerificationCard';
import { useSetupVerification } from '../src/features/diagnostics/useSetupVerification';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import { ActiveSessionCard } from '../src/features/schedule/components/ActiveSessionCard';
import { FocusBlockRow } from '../src/features/schedule/components/FocusBlockRow';
import { focusBlockAppliesToDevice } from '../src/features/schedule/deviceScope';
import { getFocusBlockRuntimeStatus } from '../src/features/schedule/runtimeStatus';
import { reconcileFocusBlocks } from '../src/features/schedule/scheduler';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
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
    () =>
      deviceId === null
        ? []
        : focusBlocks.filter((block) =>
            focusBlockAppliesToDevice(block, deviceId),
          ),
    [focusBlocks, deviceId],
  );
  const blocksNeedingDeviceSelection = useMemo(
    () =>
      applicableBlocks.filter(
        (block) =>
          hasSavedActivitySelection(block.selection.activitySelection) &&
          !isSlotPopulated(selectionIdForBlock(block.id)),
      ),
    [applicableBlocks],
  );
  const { active, now } = useActiveBlock(applicableBlocks);

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const setupBlock = useSettingsStore((s) => s.setupBlock);

  const posture = useProtectionPosture();
  const showProtectionCard = posture.score !== 'full';
  const setupVerification = useSetupVerification();

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

  const lockInTitle = !setupBlock
    ? 'Set up Lock-in'
    : isAdminLocked
      ? 'Locked'
      : 'Editable now';
  const lockInSubtitle = !setupBlock
    ? 'Set a weekly setup window so you can edit blocks only during it.'
    : isAdminLocked
      ? `Editable next during your setup block (${setupBlock.startTime}–${setupBlock.endTime}).`
      : 'You are inside your setup window — edits are allowed.';

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
        {active && <ActiveSessionCard status={active} now={now} />}

        <Section title="Configuration">
          {permissionsDenied ? (
            <Card tone="signal">
              <View className="flex-row items-center gap-2">
                <Icon name="lock.shield.fill" size={24} tone="signal" />
                <Typography variant="h3" tone="signal">
                  Permission denied
                </Typography>
              </View>
              <Typography variant="body" tone="ink">
                Open iOS Settings → Screen Time → Family Controls and allow
                Focus Blocks. iOS won't show the prompt again from inside the
                app.
              </Typography>
              <Button
                title="Open Settings"
                variant="commit"
                onPress={() => {
                  void haptic.select();
                  void Linking.openSettings();
                }}
              />
            </Card>
          ) : !hasPermissions ? (
            <Card tone="signal">
              <View className="flex-row items-center gap-2">
                <Icon name="lock.shield.fill" size={24} tone="signal" />
                <Typography variant="h3" tone="signal">
                  Grant access
                </Typography>
              </View>
              <Typography variant="body" tone="ink">
                Focus Blocks needs Screen Time permissions to block distracting
                apps.
              </Typography>
              <Button
                title="Give access"
                variant="commit"
                onPress={() => void handleGrant()}
                isLoading={busyState === 'authorizing'}
                disabled={busyState !== 'idle'}
              />
            </Card>
          ) : null}

          <SetupVerificationCard verification={setupVerification} />

          {showProtectionCard && (
            <ProtectionStatusCard
              posture={posture}
              onPress={() => router.push('/protection')}
            />
          )}

          <Card onPress={() => router.push('/settings')}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Icon
                  name={isAdminLocked ? 'lock.fill' : 'lock.open.fill'}
                  size={20}
                  tone={isAdminLocked ? 'signal' : 'muted'}
                />
                <Typography variant="h3" tone="ink">
                  {lockInTitle}
                </Typography>
              </View>
              <Icon name="chevron.right" size={16} tone="faint" />
            </View>
            <Typography variant="body" tone="muted">
              {lockInSubtitle}
            </Typography>
          </Card>
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
