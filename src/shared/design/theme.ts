import { Easing } from 'react-native-reanimated';

export const color = {
  surface: '#1F1B17',
  surfaceRaised: '#2A2521',
  surfaceSunken: '#16130F',
  ink: '#F4EEE3',
  inkMuted: '#A8A095',
  inkFaint: '#635B52',
  signal: '#E8884A',
  signalSoft: '#C57B4C',
  divider: '#3A342D',
  danger: '#D94B2F',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
  hero: 96,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const motion = {
  fast: 140,
  base: 280,
  slow: 420,
  slower: 600,
  easeOut: Easing.out(Easing.exp),
  easeIn: Easing.in(Easing.exp),
  easeInOut: Easing.inOut(Easing.exp),
} as const;
