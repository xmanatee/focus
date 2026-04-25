import { View } from 'react-native';
import { Typography } from './Typography';

interface CodeRevealProps {
  readonly value: string;
}

export function CodeReveal({ value }: CodeRevealProps): JSX.Element {
  return (
    <View className="bg-surface-sunken rounded-2xl px-4 py-5 items-center">
      <Typography
        variant="display-md"
        tone="ink"
        className="font-mono tracking-[4px]"
      >
        {value}
      </Typography>
    </View>
  );
}
