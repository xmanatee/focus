import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import { useTamperSetupStore } from '../src/features/protection/useTamperSetupStore';
import { isFocusBlockActiveAt } from '../src/features/schedule/activeness';
import { ActiveSessionCard } from '../src/features/schedule/components/ActiveSessionCard';
import { FocusBlockRow } from '../src/features/schedule/components/FocusBlockRow';
import { reconcileFocusBlocks } from '../src/features/schedule/scheduler';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { Button } from '../src/shared/components/Button';
import { Icon } from '../src/shared/components/Icon';
import { ProtectionStatusCard } from '../src/shared/components/ProtectionStatusCard';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { haptic } from '../src/shared/design/haptics';

export default function MainFeedScreen(): JSX.Element {
  const router = useRouter();
  const initialize = useBlockerStore((s) => s.initialize);
  const authorizationStatus = useBlockerStore((s) => s.authorizationStatus);
  const busyState = useBlockerStore((s) => s.busyState);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);
  const hasPermissions = authorizationStatus === 'authorized';

  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const toggleFocusBlock = useFocusBlockStore((s) => s.toggleFocusBlock);
  const { active, isStrict, now } = useActiveBlock(focusBlocks);

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const setupBlock = useSettingsStore((s) => s.setupBlock);

  const tamperCompletedAt = useTamperSetupStore((s) => s.setup.completedAt);
  const posture = useProtectionPosture();
  const showProtectionCard = tamperCompletedAt === null;

  const lockedAll = isAdminLocked || isStrict;

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    void reconcileFocusBlocks(focusBlocks, setupBlock);
  }, [focusBlocks, setupBlock]);

  const handleGrant = async (): Promise<void> => {
    void haptic.commit();
    await requestPermissions();
  };

  const handleToggle = (blockId: string, nextIsEnabled: boolean): void => {
    void haptic.select();
    toggleFocusBlock(blockId, nextIsEnabled);
  };

  if (authorizationStatus === 'denied') {
    return (
      <Screen>
        <View className="flex-1 justify-center gap-5">
          <Typography variant="label" tone="danger">
            Permission denied
          </Typography>
          <Typography variant="display-md" tone="ink">
            Open iOS Settings.
          </Typography>
          <Typography variant="body" tone="muted" className="max-w-[340px]">
            Go to Settings → Screen Time → Family Controls and allow Focus
            Blocks. iOS won&apos;t show the prompt again from inside the app.
          </Typography>
          <View className="mt-4">
            <Button
              title="Open Settings"
              variant="commit"
              onPress={() => {
                void haptic.select();
                void Linking.openSettings();
              }}
            />
          </View>
        </View>
      </Screen>
    );
  }

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
        {!hasPermissions && (
          <View className="bg-signal/10 rounded-[32px] p-card gap-3 border border-signal/20">
            <View className="flex-row items-center gap-2">
              <Icon name="lock.shield.fill" size={24} tone="signal" />
              <Typography variant="h3" tone="signal">
                Grant Access
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
          </View>
        )}

        {active && (
          <ActiveSessionCard
            block={active}
            now={now}
            onEmergencyExit={
              isStrict ? () => router.push('/emergency') : undefined
            }
          />
        )}

        {showProtectionCard && (
          <ProtectionStatusCard
            posture={posture}
            onPress={() => router.push('/protection')}
          />
        )}

        <View className="gap-4">
          <Typography variant="label" tone="faint" className="px-2">
            Configuration
          </Typography>
          <Pressable
            onPress={() => router.push('/settings')}
            disabled={isStrict}
            className={`bg-surface-raised rounded-[32px] p-card gap-3 ${
              isStrict ? 'opacity-50' : ''
            }`}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Icon
                  name={isAdminLocked ? 'lock.fill' : 'lock.open.fill'}
                  size={20}
                  tone={isAdminLocked ? 'signal' : 'muted'}
                />
                <Typography variant="h3" tone="ink">
                  {isAdminLocked
                    ? 'Locked Down'
                    : setupBlock
                      ? 'Setup Block Active'
                      : 'Stay Focused'}
                </Typography>
              </View>
              <Icon name="chevron.right" size={16} tone="faint" />
            </View>
            <Typography variant="body" tone="muted">
              {setupBlock
                ? isAdminLocked
                  ? `Focus blocks are locked. Changes only allowed during your setup block (${setupBlock.startTime}–${setupBlock.endTime}).`
                  : 'Focus blocks are unlocked. You can now edit your focus blocks.'
                : 'Set a weekly setup block to lock your focus blocks and prevent yourself from disabling Focus Blocks.'}
            </Typography>
          </Pressable>
        </View>

        <View className="gap-6">
          <View className="flex-row items-center justify-between px-2">
            <Typography variant="label" tone="faint">
              Focus Blocks
            </Typography>
            <Pressable
              onPress={() => {
                void haptic.select();
                router.push('/add-focus-block');
              }}
              disabled={lockedAll}
              className={`h-10 w-10 items-center justify-center rounded-full bg-signal ${
                lockedAll ? 'opacity-40' : ''
              }`}
            >
              <Icon name="plus" size={20} tone="surface" />
            </Pressable>
          </View>

          {focusBlocks.length === 0 ? (
            <View className="bg-surface-raised/50 rounded-[32px] py-12 items-center gap-3 border border-divider/30 border-dashed">
              <Typography variant="body" tone="muted" align="center">
                Your focus calendar is empty.
              </Typography>
              <Button
                title="Add a block"
                variant="commit"
                onPress={() => router.push('/add-focus-block')}
                disabled={lockedAll}
              />
            </View>
          ) : (
            <View className="gap-4">
              {focusBlocks.map((block) => {
                const isActive = isFocusBlockActiveAt(block, now);
                const isRowLocked = isActive || lockedAll;
                return (
                  <FocusBlockRow
                    key={block.id}
                    block={block}
                    isActive={isActive}
                    locked={isRowLocked}
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
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
