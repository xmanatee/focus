import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { type ThemeColors, useThemeColors } from '../design/theme';

type IconTone = 'muted' | 'faint' | 'signal' | 'surface';
type SymbolName = SymbolViewProps['name'];
type FallbackName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  readonly name: SymbolName;
  readonly size: number;
  readonly tone: IconTone;
}

const fallbackNameBySymbolName: Partial<Record<SymbolName, FallbackName>> = {
  'app.badge': 'apps',
  'chart.bar.fill': 'bar-chart',
  'checkmark.circle.fill': 'checkmark-circle',
  'checkmark.seal.fill': 'checkmark-circle',
  'chevron.right': 'chevron-forward',
  circle: 'ellipse-outline',
  'exclamationmark.triangle.fill': 'warning',
  globe: 'globe-outline',
  'info.circle': 'information-circle-outline',
  'lock.fill': 'lock-closed',
  'lock.open.fill': 'lock-open',
  plus: 'add',
  'questionmark.circle': 'help-circle-outline',
  sparkles: 'sparkles',
  'square.grid.2x2.fill': 'grid',
  star: 'star',
  'star.fill': 'star',
  stethoscope: 'medical-outline',
  xmark: 'close',
  'xmark.circle.fill': 'close-circle',
};

function resolveTone(tone: IconTone, colors: ThemeColors): string {
  switch (tone) {
    case 'muted':
      return colors.inkMuted;
    case 'faint':
      return colors.inkFaint;
    case 'signal':
      return colors.signal;
    case 'surface':
      return colors.surface;
  }
}

export function Icon({ name, size, tone }: IconProps): JSX.Element {
  const colors = useThemeColors();
  const color = resolveTone(tone, colors);
  const fallbackName = fallbackNameBySymbolName[name] ?? 'help-circle-outline';
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      fallback={
        <Ionicons
          name={fallbackName}
          size={size}
          color={color}
          style={{ height: size, lineHeight: size, width: size }}
        />
      }
      weight="regular"
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
