import { Pressable, View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import type {
  SetupVerification,
  SetupVerificationAction,
  SetupVerificationStatus,
} from '../diagnostics';
import { setupActionForCheck } from '../diagnostics';

function iconFor(status: SetupVerificationStatus): {
  readonly name: 'checkmark.seal.fill' | 'exclamationmark.triangle.fill';
  readonly tone: 'signal' | 'muted';
} {
  if (status === 'pass') {
    return { name: 'checkmark.seal.fill', tone: 'signal' };
  }
  return { name: 'exclamationmark.triangle.fill', tone: 'muted' };
}

function actionLabel(action: SetupVerificationAction): string {
  switch (action) {
    case 'requestScreenTime':
      return 'Fix access';
    case 'finishDeviceSetup':
      return 'Pick apps';
    case 'openProtection':
      return 'Set up';
    case 'addBlock':
      return 'Add block';
    case 'openDiagnostics':
      return 'Details';
  }
}

export function SetupVerificationCard({
  onAction,
  onOpenDetails,
  verification,
}: {
  readonly onAction?: (action: SetupVerificationAction) => void;
  readonly onOpenDetails?: () => void;
  readonly verification: SetupVerification;
}): JSX.Element {
  const tone = verification.level === 'ready' ? 'raised' : 'signal';

  return (
    <Card tone={tone}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography variant="label" tone="faint">
            Setup check
          </Typography>
          <Typography variant="h3" tone="ink">
            {verification.title}
          </Typography>
          <Typography variant="body" tone="muted">
            {verification.summary}
          </Typography>
        </View>
        <Icon
          name={
            verification.level === 'ready'
              ? 'checkmark.seal.fill'
              : 'exclamationmark.triangle.fill'
          }
          size={24}
          tone={verification.level === 'ready' ? 'signal' : 'muted'}
        />
      </View>

      <View className="h-[1px] bg-divider" />

      <View className="gap-2">
        {verification.checks.map((check) => {
          const icon = iconFor(check.status);
          const action = setupActionForCheck(check.id);
          return (
            <View key={check.id} className="flex-row gap-2 items-start">
              <View className="pt-0.5">
                <Icon name={icon.name} size={16} tone={icon.tone} />
              </View>
              <View className="flex-1">
                <Typography variant="caption" tone="ink">
                  {check.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {check.detail}
                </Typography>
              </View>
              {check.status !== 'pass' && onAction ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onAction(action)}
                  className="min-h-11 items-center justify-center rounded-full bg-surface px-4"
                >
                  <Typography variant="caption" tone="signal">
                    {actionLabel(action)}
                  </Typography>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>

      {onOpenDetails ? (
        <Button title="Troubleshoot" variant="ghost" onPress={onOpenDetails} />
      ) : null}
    </Card>
  );
}
