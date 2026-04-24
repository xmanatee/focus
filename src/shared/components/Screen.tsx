import type { ReactNode } from 'react';
import { View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  readonly children: ReactNode;
  readonly tone?: 'surface' | 'sunken';
  readonly edges?: readonly Edge[];
  readonly padded?: boolean;
}

export function Screen({
  children,
  tone = 'surface',
  edges = ['top', 'bottom'],
  padded = true,
}: ScreenProps): JSX.Element {
  const bg = tone === 'sunken' ? 'bg-surface-sunken' : 'bg-surface';

  return (
    <SafeAreaView edges={edges} className={`flex-1 ${bg}`}>
      <View className={`flex-1 ${padded ? 'px-6' : ''}`}>{children}</View>
    </SafeAreaView>
  );
}
