import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDark, useThemeColors } from '../design/theme';

interface ScreenEdgeEffectProps {
  readonly showBottom: boolean;
  readonly showTop: boolean;
}

export function ScreenEdgeEffect({
  showBottom,
  showTop,
}: ScreenEdgeEffectProps): JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const overlayTint = isDark
    ? withAlpha(colors.surface, 0.72)
    : withAlpha(colors.surface, 0.58);
  const tint = isDark ? 'dark' : 'light';

  return (
    <>
      {showTop ? (
        <View
          pointerEvents="none"
          style={[
            styles.edge,
            {
              top: 0,
              height: Math.max(insets.top + 18, 52),
            },
          ]}
        >
          <BlurView
            intensity={32}
            tint={tint}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: overlayTint }]}
          />
        </View>
      ) : null}

      {showBottom ? (
        <View
          pointerEvents="none"
          style={[
            styles.edge,
            {
              bottom: 0,
              height: Math.max(insets.bottom + 24, 44),
            },
          ]}
        >
          <BlurView
            intensity={36}
            tint={tint}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: overlayTint }]}
          />
        </View>
      ) : null}
    </>
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
});
