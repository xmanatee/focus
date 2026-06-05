import { View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import type {
  SetupVerification,
  SetupVerificationStatus,
} from '../diagnostics';

function iconFor(status: SetupVerificationStatus): {
  readonly name: 'checkmark.seal.fill' | 'exclamationmark.triangle.fill';
  readonly tone: 'signal' | 'muted';
} {
  if (status === 'pass') {
    return { name: 'checkmark.seal.fill', tone: 'signal' };
  }
  return { name: 'exclamationmark.triangle.fill', tone: 'muted' };
}

export function SetupVerificationCard({
  verification,
}: {
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
          return (
            <View key={check.id} className="flex-row gap-2">
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
            </View>
          );
        })}
      </View>
    </Card>
  );
}
