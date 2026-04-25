import { View } from 'react-native';
import { formatRelative } from '../days';
import { Typography } from './Typography';

interface CountdownPillProps {
  readonly target: Date;
  readonly now: Date;
}

export function CountdownPill({
  target,
  now,
}: CountdownPillProps): JSX.Element {
  return (
    <View className="self-start bg-signal/20 px-2 py-0.5 rounded-md">
      <Typography variant="caption" tone="signal">
        Unlocks {formatRelative(target, now)}
      </Typography>
    </View>
  );
}
