import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDark, useThemeColors } from '../design/theme';

interface ScreenEdgeEffectProps {
  readonly blurTarget: RefObject<View | null>;
  readonly showBottom: boolean;
  readonly showTop: boolean;
}

export function ScreenEdgeEffect({
  blurTarget,
  showBottom,
  showTop,
}: ScreenEdgeEffectProps): React.JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const overlayTint = isDark
    ? withAlpha(colors.surface, 0.72)
    : withAlpha(colors.surface, 0.58);
  const transparentTint = withAlpha(colors.surface, 0);
  const tint = isDark ? 'dark' : 'light';

  return (
    <>
      {showTop ? (
        <EdgeMaterial
          edge="top"
          blurTarget={blurTarget}
          height={Math.max(insets.top + 24, 58)}
          overlayTint={overlayTint}
          transparentTint={transparentTint}
          tint={tint}
        />
      ) : null}

      {showBottom ? (
        <EdgeMaterial
          edge="bottom"
          blurTarget={blurTarget}
          height={Math.max(insets.bottom + 30, 52)}
          overlayTint={overlayTint}
          transparentTint={transparentTint}
          tint={tint}
        />
      ) : null}
    </>
  );
}

function EdgeMaterial({
  blurTarget,
  edge,
  height,
  overlayTint,
  transparentTint,
  tint,
}: {
  readonly blurTarget: RefObject<View | null>;
  readonly edge: 'bottom' | 'top';
  readonly height: number;
  readonly overlayTint: string;
  readonly transparentTint: string;
  readonly tint: 'dark' | 'light';
}): React.JSX.Element {
  const isTop = edge === 'top';
  const maskColors = isTop
    ? (['black', 'rgba(0,0,0,0.72)', 'transparent'] as const)
    : (['transparent', 'rgba(0,0,0,0.72)', 'black'] as const);
  const overlayColors = isTop
    ? ([overlayTint, overlayTint, transparentTint] as const)
    : ([transparentTint, overlayTint, overlayTint] as const);

  return (
    <View
      pointerEvents="none"
      style={[styles.edge, isTop ? { top: 0, height } : { bottom: 0, height }]}
    >
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={maskColors}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <BlurView
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          intensity={36}
          tint={tint}
          style={styles.fill}
        />
      </MaskedView>
      <LinearGradient
        colors={overlayColors}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((part) => part + part)
          .join('')
      : normalized;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

const styles = StyleSheet.create({
  edge: {
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  fill: {
    flex: 1,
  },
});
