import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ThemeColors, useThemeColors } from '../design/theme';

type IconTone = 'muted' | 'faint' | 'signal' | 'surface';

interface IconProps {
  readonly name: SymbolViewProps['name'];
  readonly size: number;
  readonly tone: IconTone;
}

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
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={resolveTone(tone, colors)}
      weight="regular"
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
