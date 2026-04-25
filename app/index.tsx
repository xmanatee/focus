import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { useProtectionPosture } from '../src/features/protection/useProtectionPosture';
import { isFocusBlockActiveAt } from '../src/features/schedule/activeness';
import { ActiveSessionCard } from '../src/features/schedule/components/ActiveSessionCard';
import { FocusBlockRow } from '../src/features/schedule/components/FocusBlockRow';
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
  const { active, isStrict, now } = useActiveBlock(focusBlocks);

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const setupBlock = useSettingsStore((s) => s.setupBlock);

  const posture = useProtectionPosture();
  const showProtectionCard = posture.score !== 'full';

  const lockedAll = isAdminLocked || isStrict;

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

  const lockInTitle = !setupBlock
    ? 'Lock-in'
    : isAdminLocked
      ? 'Lock-in active'
      : 'Lock-in unlocked';
  const lockInSubtitle = !setupBlock
    ? 'Set a weekly setup window to lock your focus blocks and prevent yourself from disabling them.'
    : isAdminLocked
      ? `Focus blocks are locked. Changes only allowed during your setup block (${setupBlock.startTime}–${setupBlock.endTime}).`
      : 'Focus blocks are unlocked. You can edit them right now.';

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
        {active && <ActiveSessionCard block={active} now={now} />}

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

          {showProtectionCard && (
            <ProtectionStatusCard
              posture={posture}
              onPress={() => router.push('/protection')}
            />
          )}

          <Card onPress={() => router.push('/settings')} disabled={isStrict}>
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
              disabled={lockedAll}
              className={`h-10 w-10 items-center justify-center rounded-full bg-signal ${
                lockedAll ? 'opacity-40' : ''
              }`}
            >
              <Icon name="plus" size={20} tone="surface" />
            </Pressable>
          }
        >
          {focusBlocks.length === 0 ? (
            <Card tone="dashed" className="py-12 items-center">
              <Typography variant="body" tone="muted" align="center">
                Your focus calendar is empty.
              </Typography>
              <Button
                title="Add a block"
                variant="commit"
                onPress={() => router.push('/add-focus-block')}
                disabled={lockedAll}
              />
            </Card>
          ) : (
            focusBlocks.map((block) => {
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
            })
          )}
        </Section>
      </ScrollView>
    </Screen>
  );
}
