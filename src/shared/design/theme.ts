import { useColorScheme } from 'react-native';

export interface ThemeColors {
  readonly surface: string;
  readonly surfaceSunken: string;
  readonly ink: string;
  readonly inkMuted: string;
  readonly inkFaint: string;
  readonly signal: string;
  readonly divider: string;
  readonly danger: string;
}

const light: ThemeColors = {
  surface: '#F8F2E8',
  surfaceSunken: '#EDE5D6',
  ink: '#2B221A',
  inkMuted: '#7A6D5F',
  inkFaint: '#B8AC9D',
  signal: '#EA7A3A',
  divider: '#E4DBC9',
  danger: '#D94B2F',
};

const dark: ThemeColors = {
  surface: '#1A1510',
  surfaceSunken: '#100D08',
  ink: '#F5EEDF',
  inkMuted: '#A69686',
  inkFaint: '#5F574B',
  signal: '#F0935C',
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
} as const;
