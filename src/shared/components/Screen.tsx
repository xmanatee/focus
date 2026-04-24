import type { ReactNode } from 'react';
import { View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps {
  readonly children: ReactNode;
  readonly edges?: readonly Edge[];
  readonly padded?: boolean;
}

export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = true,
}: ScreenProps): JSX.Element {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-surface">
      <View className={`flex-1 ${padded ? 'px-6' : ''}`}>{children}</View>
    </SafeAreaView>
  );
}
