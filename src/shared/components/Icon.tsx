import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ThemeColors, useThemeColors } from '../design/theme';

type IconTone = 'ink' | 'muted' | 'faint' | 'signal' | 'danger' | 'surface';

interface IconProps {
  readonly name: SymbolViewProps['name'];
  readonly size?: number;
  readonly tone?: IconTone;
  readonly weight?: SymbolViewProps['weight'];
}

function resolveTone(tone: IconTone, colors: ThemeColors): string {
  switch (tone) {
    case 'ink':
      return colors.ink;
    case 'muted':
      return colors.inkMuted;
    case 'faint':
      return colors.inkFaint;
    case 'signal':
      return colors.signal;
    case 'danger':
      return colors.danger;
    case 'surface':
      return colors.surface;
  }
}

export function Icon({
  name,
  size = 20,
  tone = 'ink',
  weight = 'regular',
}: IconProps): JSX.Element {
  const colors = useThemeColors();
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={resolveTone(tone, colors)}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
