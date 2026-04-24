import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import {
  EMPTY_BLOCK_SELECTION,
  selectionHasBlockedTargets,
} from '../src/features/blocker/types';
import { useBlockerStore } from '../src/features/blocker/useBlockerStore';
import { isFocusBlockActiveAt } from '../src/features/schedule/activeness';
import { reconcileFocusBlocks } from '../src/features/schedule/scheduler';
import { useActiveBlock } from '../src/features/schedule/useActiveBlock';
import { useFocusBlockStore } from '../src/features/schedule/useFocusBlockStore';
import { useAdminState } from '../src/features/settings/useAdminState';
import { useSettingsStore } from '../src/features/settings/useSettingsStore';
import { Button } from '../src/shared/components/Button';
import { Icon } from '../src/shared/components/Icon';
import { Screen } from '../src/shared/components/Screen';
import { Typography } from '../src/shared/components/Typography';
import { formatDayShort, formatRelative } from '../src/shared/days';
import { haptic } from '../src/shared/design/haptics';
import { useThemeColors } from '../src/shared/design/theme';
import { useAsyncAction } from '../src/shared/hooks/useAsyncAction';

export default function MainFeedScreen(): JSX.Element {
  const router = useRouter();
  const colors = useThemeColors();
  const initialize = useBlockerStore((s) => s.initialize);
  const authorizationStatus = useBlockerStore((s) => s.authorizationStatus);
  const busyState = useBlockerStore((s) => s.busyState);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);
  const hasPermissions = authorizationStatus === 'authorized';

  const focusBlocks = useFocusBlockStore((s) => s.focusBlocks);
  const toggleFocusBlock = useFocusBlockStore((s) => s.toggleFocusBlock);
  const { active, now } = useActiveBlock(focusBlocks);

  const { state: adminState } = useAdminState();
  const isAdminLocked = adminState.kind === 'locked';
  const setupBlock = useSettingsStore((s) => s.setupBlock);

  const { run } = useAsyncAction();

  useEffect(() => {
    void (async () => {
      try {
        await initialize();
      } catch {
        // Silently fail auth check on launch to avoid crash
      }
    })();
  }, [initialize]);

  useEffect(() => {
    void (async () => {
      try {
        await reconcileFocusBlocks(
          focusBlocks.map((b) => ({
            id: b.id,
            days: b.days,
            startTime: b.startTime,
            endTime: b.endTime,
            isEnabled: b.isEnabled,
            profileSelection: b.selection ?? EMPTY_BLOCK_SELECTION,
          })),
        );
      } catch {
        // Prevent background sync from crashing the app
      }
    })();
  }, [focusBlocks]);

  const handleGrant = (): Promise<boolean> =>
    run(async () => {
      void haptic.commit();
      const granted = await requestPermissions();
      if (!granted) {
        throw new Error('Screen Time permission was not granted.');
      }
    }, 'Could not request Screen Time permission.');

  const handleToggle = (
    blockId: string,
    nextIsEnabled: boolean,
  ): Promise<boolean> => {
    void haptic.select();
    return run(async () => {
      toggleFocusBlock(blockId, nextIsEnabled);
    }, 'Could not update focus block.');
  };

  if (authorizationStatus === 'denied') {
    return (
      <Screen>
        <View className="flex-row justify-between items-center py-3 mb-2">
          <Typography variant="label" tone="signal">
            Fucus
          </Typography>
        </View>
        <View className="flex-1 justify-center gap-5">
          <Typography variant="label" tone="danger">
            Permission denied
          </Typography>
          <Typography variant="display-md" tone="ink">
            Open iOS Settings.
          </Typography>
          <Typography variant="body" tone="muted" className="max-w-[340px]">
            Go to Settings → Screen Time → Family Controls and allow Fucus. iOS
            won&apos;t show the prompt again from inside the app.
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
      <View className="px-6">
        <View className="flex-row justify-between items-center py-3 mb-2">
          <Typography variant="label" tone="signal">
            Fucus
          </Typography>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 40,
          gap: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Prompt Card */}
        {!hasPermissions && (
          <View className="bg-signal/10 rounded-[32px] p-6 gap-4 border border-signal/20">
            <View className="flex-row items-center gap-3">
              <Icon name="lock.shield.fill" size={24} tone="signal" />
              <Typography variant="h3" tone="signal">
                Grant Access
              </Typography>
            </View>
            <Typography variant="body" tone="ink">
              Fucus needs Screen Time permissions to block distracting apps.
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

        {/* Active Session Card */}
        {active && (
          <View className="bg-ink rounded-[32px] p-7 gap-3 shadow-xl">
            <Typography variant="label" tone="surface" className="opacity-70">
              Active Session
            </Typography>
            <Typography variant="display-md" tone="surface">
              {active.name}
            </Typography>
            <Typography variant="body" tone="surface" className="opacity-70">
              Ends at {active.endTime} ·{' '}
              {formatRelative(
                (() => {
                  const end = new Date(now);
                  const [h, m] = active.endTime.split(':').map(Number);
                  end.setHours(h ?? 0, m ?? 0, 0, 0);
                  if (end <= now) end.setDate(end.getDate() + 1);
                  return end;
                })(),
                now,
              )}
            </Typography>
          </View>
        )}

        {/* Lock-in Section */}
        <View className="gap-4">
          <Typography variant="label" tone="faint" className="px-2">
            Configuration
          </Typography>
          <Pressable
            onPress={() => router.push('/settings')}
            className="bg-surface-raised rounded-[32px] p-6 gap-3"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
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
                : 'Set a weekly setup block to lock your focus blocks and prevent yourself from disabling Fucus.'}
            </Typography>
          </Pressable>
        </View>

        {/* Focus Blocks Section */}
        <View className="gap-6">
          <View className="flex-row items-center justify-between px-2">
            <Typography variant="label" tone="faint">
              Focus Blocks
            </Typography>
            <Pressable
              onPress={() => {
                if (isAdminLocked) return;
                void haptic.select();
                router.push('/add-focus-block');
              }}
              disabled={isAdminLocked}
              className={`h-10 w-10 items-center justify-center rounded-full bg-signal ${
                isAdminLocked ? 'opacity-40' : ''
              }`}
            >
              <Icon name="plus" size={20} tone="surface" />
            </Pressable>
          </View>

          {focusBlocks.length === 0 ? (
            <View className="bg-surface-raised/50 rounded-[32px] py-12 items-center gap-4 border border-divider/30 border-dashed">
              <Typography variant="body" tone="muted" align="center">
                Your focus calendar is empty.
              </Typography>
              <Button
                title="Add a block"
                variant="commit"
                onPress={() => router.push('/add-focus-block')}
                disabled={isAdminLocked}
              />
            </View>
          ) : (
            <View className="gap-4">
              {focusBlocks.map((block) => {
                const isActive = isFocusBlockActiveAt(block, now);
                const isRowLocked = isActive || isAdminLocked;
                const selection = block.selection ?? EMPTY_BLOCK_SELECTION;
                return (
                  <View
                    key={block.id}
                    className="bg-surface-raised rounded-[32px] p-6 gap-4"
                  >
                    <View className="flex-row justify-between items-start">
                      <Pressable
                        onPress={() => {
                          if (isRowLocked) return;
                          void haptic.select();
                          router.push({
                            pathname: '/add-focus-block',
                            params: { id: block.id },
                          });
                        }}
                        disabled={isRowLocked}
                        className="flex-1"
                      >
                        <View className="flex-row items-center gap-2">
                          <Typography variant="h3" tone="ink">
                            {block.name}
                          </Typography>
                          {isActive && (
                            <View className="bg-signal/20 px-2 py-0.5 rounded-md">
                              <Typography variant="caption" tone="signal">
                                Active
                              </Typography>
                            </View>
                          )}
                        </View>
                        <Typography
                          variant="caption"
                          tone="muted"
                          className="mt-1"
                        >
                          {block.days.join(' · ').toUpperCase()} ·{' '}
                          {block.startTime}–{block.endTime}
                        </Typography>
                        <View className="flex-row items-center gap-3 mt-3">
                          <View className="bg-surface-sunken px-3 py-1.5 rounded-full flex-row items-center gap-2">
                            <Icon name="app.badge" size={12} tone="muted" />
                            <Typography variant="caption" tone="muted">
                              {selection.activitySelection.status === 'saved'
                                ? `${selection.activitySelection.applicationCount} apps`
                                : '0 apps'}
                            </Typography>
                          </View>
                          {selection.webDomains.length > 0 && (
                            <View className="bg-surface-sunken px-3 py-1.5 rounded-full flex-row items-center gap-2">
                              <Icon name="globe" size={12} tone="muted" />
                              <Typography variant="caption" tone="muted">
                                {selection.webDomains.length} sites
                              </Typography>
                            </View>
                          )}
                        </View>
                      </Pressable>
                      <View className="flex-row items-center gap-3">
                        <Switch
                          value={block.isEnabled}
                          onValueChange={(nextValue) =>
                            void handleToggle(block.id, nextValue)
                          }
                          disabled={isRowLocked}
                          trackColor={{
                            true: colors.signal,
                            false: colors.divider,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
