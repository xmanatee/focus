import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { BlockerBridge } from '../src/bridge/BlockerBridge';
import { DiagnosticsCard } from '../src/features/diagnostics/components/DiagnosticsCard';
import { SetupVerificationCard } from '../src/features/diagnostics/components/SetupVerificationCard';
import { evaluateSetupVerification } from '../src/features/diagnostics/diagnostics';
import { useDiagnosticsSnapshot } from '../src/features/diagnostics/useDiagnosticsSnapshot';
import { useSetupActionHandler } from '../src/features/diagnostics/useSetupActionHandler';
import { focusBlockSelectionReadyInSlots } from '../src/features/schedule/localActivitySelection';
import { focusBlockRunnableLocally } from '../src/features/schedule/localRuntime';
import { missingRuntimeAccess } from '../src/features/schedule/runtimeAccess';
import { getFocusBlockRuntimeStatus } from '../src/features/schedule/runtimeStatus';
import type {
  FocusBlock,
  RuntimeFocusBlock,
} from '../src/features/schedule/types';
import { Button } from '../src/shared/components/Button';
import { Card } from '../src/shared/components/Card';
import { Icon } from '../src/shared/components/Icon';
import { Screen } from '../src/shared/components/Screen';
import { Section } from '../src/shared/components/Section';
import { Typography } from '../src/shared/components/Typography';
import { formatActiveDays } from '../src/shared/days';
import { useCurrentMinute } from '../src/shared/hooks/useCurrentMinute';
import { useDismiss } from '../src/shared/hooks/useDismiss';

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
  block: RuntimeFocusBlock,
  now: Date,
  selectionReady: boolean,
  runtimeAccessReady: boolean,
): string {
  if (!selectionReady) return 'Needs app selection on this device';
  if (!runtimeAccessReady) return 'Needs additional system access';
  const status = getFocusBlockRuntimeStatus(block, now);
  if (!block.isEnabled) return 'Off on this device';
  if (status.kind !== 'active') return 'Not active now';
  if (status.reason === 'outsideSchedule') return 'Blocking outside window';
  if (status.reason === 'budget') return 'Budget used';
  return 'Blocking now';
}

function RuleDiagnosticRow({
  block,
  now,
  selectionReady,
  runtimeAccessReady,
}: {
  readonly block: RuntimeFocusBlock;
  readonly now: Date;
  readonly selectionReady: boolean;
  readonly runtimeAccessReady: boolean;
}): React.JSX.Element {
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
            {statusLabel(block, now, selectionReady, runtimeAccessReady)}
          </Typography>
        </View>
        <View className="items-end gap-1">
          <Typography
            variant="caption"
            tone={selectionReady && runtimeAccessReady ? 'muted' : 'signal'}
          >
            {!selectionReady
              ? 'Needs apps here'
              : runtimeAccessReady
                ? 'Ready here'
                : 'Needs access'}
          </Typography>
          <Typography
            variant="caption"
            tone={block.isEnabled ? 'muted' : 'faint'}
          >
            {block.isEnabled ? 'On here' : 'Off here'}
          </Typography>
        </View>
      </View>
    </Card>
  );
}

export default function DiagnosticsScreen(): React.JSX.Element {
  const dismiss = useDismiss();
  const snapshot = useDiagnosticsSnapshot();
  const handleSetupAction = useSetupActionHandler();
  const now = useCurrentMinute();

  const verification = useMemo(
    () => evaluateSetupVerification({ ...snapshot, now }),
    [snapshot, now],
  );

  return (
    <Screen padded={false} edges={['bottom']} edgeEffect="soft">
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
                {BlockerBridge.capabilities.authorizationAccessName} must be
                authorized, the block must be turned on here, the current time
                must match the rule, required feature access must be granted,
                and app selections must be picked locally on this device.
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
          {snapshot.focusBlocks.length === 0 ? (
            <Card tone="dashed">
              <Typography variant="body" tone="muted" align="center">
                No rules are available yet.
              </Typography>
            </Card>
          ) : (
            snapshot.focusBlocks.map((block) => {
              const selectionReady = focusBlockSelectionReadyInSlots(
                block,
                snapshot.populatedSelectionSlots,
              );
              const runtimeAccessReady =
                missingRuntimeAccess(block, snapshot.runtimeAccess).length ===
                0;
              const runtimeBlock = focusBlockRunnableLocally(
                block,
                snapshot.enabledBlockIds.includes(block.id),
                selectionReady,
                runtimeAccessReady,
              );
              return (
                <RuleDiagnosticRow
                  key={block.id}
                  block={runtimeBlock}
                  now={now}
                  selectionReady={selectionReady}
                  runtimeAccessReady={runtimeAccessReady}
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
