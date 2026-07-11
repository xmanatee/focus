import { View } from 'react-native';
import { BlockerBridge } from '../../bridge/BlockerBridge';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Icon } from '../../shared/components/Icon';
import { Typography } from '../../shared/components/Typography';
import type { QuickStartPhase } from './quickStart';

interface QuickStartCopy {
  readonly title: string;
  readonly body: string;
  readonly action: string;
}

function copyForPhase(phase: QuickStartPhase): QuickStartCopy {
  const capabilities = BlockerBridge.capabilities;
  const copy: Record<QuickStartPhase, QuickStartCopy> = {
    grantAccess: {
      title: `Start with ${capabilities.authorizationAccessName}`,
      body: capabilities.authorizationRequestBody,
      action: 'Give access',
    },
    openSettings: {
      title: 'Allow access in Settings',
      body: capabilities.deniedAuthorizationDetail,
      action: 'Open Settings',
    },
    createFirstBlock: {
      title: 'Create your first block',
      body: 'Pick a template, choose the apps that pull you in, and save one rule you can trust today.',
      action: 'Start with template',
    },
    finishDevice: {
      title: 'Finish this device',
      body: capabilities.finishDeviceBody,
      action: 'Open blocks to finish',
    },
  };
  return copy[phase];
}

interface QuickStartCardProps {
  readonly phase: QuickStartPhase;
  readonly isPrimaryLoading?: boolean;
  readonly onPrimary: () => void;
}

export function QuickStartCard({
  onPrimary,
  phase,
  isPrimaryLoading = false,
}: QuickStartCardProps): JSX.Element {
  const copy = copyForPhase(phase);

  return (
    <Card tone="signal">
      <View className="flex-row items-start gap-3">
        <Icon name="sparkles" size={24} tone="signal" />
        <View className="flex-1 gap-1">
          <Typography variant="label" tone="faint">
            Setup guide
          </Typography>
          <Typography variant="h3" tone="ink">
            {copy.title}
          </Typography>
          <Typography variant="body" tone="muted">
            {copy.body}
          </Typography>
        </View>
      </View>
      <Button
        title={copy.action}
        variant="commit"
        onPress={onPrimary}
        isLoading={isPrimaryLoading}
      />
    </Card>
  );
}
