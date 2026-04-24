import { useColorScheme } from 'react-native';
import { Easing } from 'react-native-reanimated';

export interface ThemeColors {
  readonly surface: string;
  readonly surfaceRaised: string;
  readonly surfaceSunken: string;
  readonly ink: string;
  readonly inkMuted: string;
  readonly inkFaint: string;
  readonly signal: string;
  readonly signalSoft: string;
  readonly divider: string;
  readonly danger: string;
}

const light: ThemeColors = {
  surface: '#F8F2E8',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#EDE5D6',
  ink: '#2B221A',
  inkMuted: '#7A6D5F',
  inkFaint: '#B8AC9D',
  signal: '#EA7A3A',
  signalSoft: '#F5C39A',
  divider: '#E4DBC9',
  danger: '#D94B2F',
};

const dark: ThemeColors = {
  surface: '#1A1510',
  surfaceRaised: '#25201A',
  surfaceSunken: '#100D08',
  ink: '#F5EEDF',
  inkMuted: '#A69686',
  inkFaint: '#5F574B',
  signal: '#F0935C',
  signalSoft: '#B87347',
  divider: '#352E26',
  danger: '#E56A4D',
};

export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}

export const motion = {
  fast: 140,
  base: 280,
  slow: 420,
  slower: 600,
  easeOut: Easing.out(Easing.exp),
  easeIn: Easing.in(Easing.exp),
  easeInOut: Easing.inOut(Easing.exp),
} as const;
