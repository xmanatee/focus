import type { ReactNode } from 'react';
import { View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '../design/theme';
import { ScreenEdgeEffect } from './ScreenEdgeEffect';

interface ScreenProps {
  readonly children: ReactNode;
  readonly edges?: readonly Edge[];
  readonly edgeEffect?: 'none' | 'soft';
  readonly padded?: boolean;
}

export function Screen({
  children,
  edges = ['top', 'bottom'],
  edgeEffect = 'none',
  padded = true,
}: ScreenProps): JSX.Element {
  const colors = useThemeColors();
  const showTop = edgeEffect === 'soft' && edges.includes('top');
  const showBottom = edgeEffect === 'soft' && edges.includes('bottom');

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView
        edges={edges}
        style={{ flex: 1, backgroundColor: colors.surface }}
      >
        <View className={`flex-1 ${padded ? 'px-screen' : ''}`}>
          {children}
        </View>
      </SafeAreaView>
      {edgeEffect === 'soft' ? (
        <ScreenEdgeEffect showBottom={showBottom} showTop={showTop} />
      ) : null}
    </View>
  );
}
