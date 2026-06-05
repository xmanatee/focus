import { View } from 'react-native';
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

const COPY: Record<Exclude<QuickStartPhase, 'complete'>, QuickStartCopy> = {
  grantAccess: {
    title: 'Start with Screen Time access',
    body: 'Focus Blocks needs iOS Screen Time permission before it can shield apps system-wide.',
    action: 'Give access',
  },
  openSettings: {
    title: 'Allow access in Settings',
    body: "Screen Time access was denied. iOS won't show the prompt again, so Focus Blocks needs to be allowed from Settings.",
    action: 'Open Settings',
  },
  createFirstBlock: {
    title: 'Create your first block',
    body: 'Pick a template, choose the apps that pull you in, and save one rule you can trust today.',
    action: 'Start with template',
  },
  finishDevice: {
    title: 'Finish this device',
    body: 'Your rules synced, but iOS app selections must be confirmed once on this iPhone or iPad.',
    action: 'Pick apps here',
  },
  verifySetup: {
    title: 'Test your setup',
    body: 'Run the setup check once so you know Screen Time access, device selections, and active rules are ready.',
    action: 'Run setup check',
  },
};

interface QuickStartCardProps {
  readonly phase: Exclude<QuickStartPhase, 'complete'>;
  readonly onComplete: () => void;
  readonly onPrimary: () => void;
}

export function QuickStartCard({
  onComplete,
  onPrimary,
  phase,
}: QuickStartCardProps): JSX.Element {
  const copy = COPY[phase];

  return (
    <Card tone="signal">
      <View className="flex-row items-start gap-3">
        <Icon name="sparkles" size={24} tone="signal" />
        <View className="flex-1 gap-1">
          <Typography variant="label" tone="faint">
            Quick start
          </Typography>
          <Typography variant="h3" tone="ink">
            {copy.title}
          </Typography>
          <Typography variant="body" tone="muted">
            {copy.body}
          </Typography>
        </View>
      </View>
      <View className="gap-2">
        <Button title={copy.action} variant="commit" onPress={onPrimary} />
        {phase === 'verifySetup' ? (
          <Button title="Looks ready" variant="ghost" onPress={onComplete} />
        ) : null}
      </View>
    </Card>
  );
}
