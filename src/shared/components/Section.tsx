import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Typography } from './Typography';

interface SectionProps {
  readonly title: string;
  readonly action?: ReactNode;
  readonly children: ReactNode;
}

export function Section({
  title,
  action,
  children,
}: SectionProps): JSX.Element {
  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Typography variant="label" tone="faint">
          {title}
        </Typography>
        {action}
      </View>
      <View className="gap-3">{children}</View>
    </View>
  );
}
