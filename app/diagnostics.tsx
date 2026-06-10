import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DiagnosticsCard } from '../src/features/diagnostics/components/DiagnosticsCard';
import { SetupVerificationCard } from '../src/features/diagnostics/components/SetupVerificationCard';
import { evaluateSetupVerification } from '../src/features/diagnostics/diagnostics';
import { useDiagnosticsSnapshot } from '../src/features/diagnostics/useDiagnosticsSnapshot';
import { useSetupActionHandler } from '../src/features/diagnostics/useSetupActionHandler';
import { focusBlockWithDeviceEnabledState } from '../src/features/schedule/deviceActivation';
import { focusBlocksForDevice } from '../src/features/schedule/deviceScope';
import { focusBlockSelectionReadyInSlots } from '../src/features/schedule/localActivitySelection';
import { getFocusBlockRuntimeStatus } from '../src/features/schedule/runtimeStatus';
import type { FocusBlock } from '../src/features/schedule/types';
import { Button } from '../src/shared/components/Button';
import { Card } from '../src/shared/components/Card';
import { Icon } from '../src/shared/components/Icon';
import { Screen } from '../src/shared/components/Screen';
import { Section } from '../src/shared/components/Section';
import { Typography } from '../src/shared/components/Typography';
import { formatActiveDays } from '../src/shared/days';
import { useDismiss } from '../src/shared/hooks/useDismiss';

const TICK_MS = 15_000;

function ruleLabel(block: FocusBlock): string {
  const schedule = `${formatActiveDays(block.days)} ${block.startTime}-${
    block.endTime
  }`;
  switch (block.rule.kind) {
    case 'blockDuringSchedule':
      return `Blocked during ${schedule}`;
    case 'allowDuringSchedule':
      return `Allowed only during ${schedule}`;
    case 'dailyBudget':
      return `${block.rule.minutes} min/day`;
    case 'allowDuringScheduleWithBudget':
      return `Allowed during ${schedule}, ${block.rule.minutes} min/day`;
  }
}

function statusLabel(
  block: FocusBlock,
  now: Date,
  selectionReady: boolean,
): string {
  if (!selectionReady) return 'Needs app selection on this device';
  const status = getFocusBlockRuntimeStatus(block, now);
  if (!block.isEnabled) return 'Off on this device';
  if (status.kind !== 'active') return 'Not active now';
  if (status.reason === 'outsideSchedule') return 'Blocking outside window';
  if (status.reason === 'budget') return 'Budget used';
  return 'Blocking now';
}

function RuleDiagnosticRow({
  block,
  selectionReady,
  now,
}: {
  readonly block: FocusBlock;
  readonly selectionReady: boolean;
  readonly now: Date;
}): JSX.Element {
  return (
    <Card>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography variant="body-md" tone="ink">
            {block.name}
          </Typography>
          <Typography variant="caption" tone="muted">
            {ruleLabel(block)}
          </Typography>
          <Typography variant="caption" tone="muted">
            {statusLabel(block, now, selectionReady)}
          </Typography>
        </View>
        <View className="items-end gap-1">
          <Typography
            variant="caption"
            tone={selectionReady ? 'muted' : 'signal'}
          >
            {selectionReady ? 'Selection ready' : 'Pick apps here'}
          </Typography>
          <Typography
            variant="caption"
            tone={block.isEnabled ? 'muted' : 'faint'}
          >
            {block.scope.kind === 'allDevices' ? 'All devices' : 'This device'}
          </Typography>
        </View>
      </View>
    </Card>
  );
}

export default function DiagnosticsScreen(): JSX.Element {
  const dismiss = useDismiss();
  const snapshot = useDiagnosticsSnapshot();
  const handleSetupAction = useSetupActionHandler();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const applicableBlocks = useMemo(
    () => focusBlocksForDevice(snapshot.focusBlocks, snapshot.deviceId),
    [snapshot.deviceId, snapshot.focusBlocks],
  );
  const verification = useMemo(
    () => evaluateSetupVerification({ ...snapshot, now }),
    [snapshot, now],
  );

  return (
    <Screen padded={false} edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 60,
          paddingTop: 32,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-3">
          <Typography variant="display-md" tone="ink">
            Troubleshooting.
          </Typography>
          <Typography variant="body" tone="muted">
            Check the exact setup conditions that decide whether Focus Blocks
            can shield apps and websites on this device.
          </Typography>
        </View>

        <SetupVerificationCard
          verification={verification}
          onAction={handleSetupAction}
        />

        <Card>
          <View className="flex-row items-start gap-3">
            <Icon name="questionmark.circle" size={22} tone="signal" />
            <View className="flex-1 gap-1">
              <Typography variant="h3" tone="ink">
                Why something may not block
              </Typography>
              <Typography variant="body" tone="muted">
                Screen Time access must be authorized, the rule must apply to
                this device, the current time must match the rule, and synced
                app selections must be picked locally on this iPhone or iPad.
              </Typography>
            </View>
          </View>
          <Button
            title="Finish this device"
            variant="ghost"
            onPress={() => handleSetupAction('finishDeviceSetup')}
          />
        </Card>

        <Section title="Rules On This Device">
          {applicableBlocks.length === 0 ? (
            <Card tone="dashed">
              <Typography variant="body" tone="muted" align="center">
                No rules currently apply to this device.
              </Typography>
            </Card>
          ) : (
            applicableBlocks.map((block) => {
              const blockOnThisDevice = focusBlockWithDeviceEnabledState(
                block,
                snapshot.deviceId,
              );
              const selectionReady = focusBlockSelectionReadyInSlots(
                block,
                snapshot.populatedSelectionSlots,
              );
              return (
                <RuleDiagnosticRow
                  key={block.id}
                  block={blockOnThisDevice}
                  now={now}
                  selectionReady={selectionReady}
                />
              );
            })
          )}
        </Section>

        <DiagnosticsCard />
        <Button title="Done" variant="commit" onPress={dismiss} />
      </ScrollView>
    </Screen>
  );
}
