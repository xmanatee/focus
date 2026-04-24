import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { color as themeColor } from '../design/theme';

type IconTone = 'ink' | 'muted' | 'faint' | 'signal' | 'danger' | 'surface';

interface IconProps {
  readonly name: SymbolViewProps['name'];
  readonly size?: number;
  readonly tone?: IconTone;
  readonly weight?: SymbolViewProps['weight'];
}

const toneColor: Record<IconTone, string> = {
  ink: themeColor.ink,
  muted: themeColor.inkMuted,
  faint: themeColor.inkFaint,
  signal: themeColor.signal,
  danger: themeColor.danger,
  surface: themeColor.surface,
};

export function Icon({
  name,
  size = 20,
  tone = 'ink',
  weight = 'regular',
}: IconProps): JSX.Element {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={toneColor[tone]}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
