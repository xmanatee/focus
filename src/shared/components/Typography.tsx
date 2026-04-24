import { Text, type TextProps } from 'react-native';

export type TypographyVariant =
  | 'display-xl'
  | 'display-lg'
  | 'display-md'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'body-md'
  | 'caption'
  | 'label';

type TypographyTone = 'ink' | 'muted' | 'faint' | 'signal' | 'danger';
type TypographyAlign = 'left' | 'center' | 'right';

interface TypographyProps {
  readonly children: React.ReactNode;
  readonly variant?: TypographyVariant;
  readonly tone?: TypographyTone;
  readonly align?: TypographyAlign;
  readonly numeric?: boolean;
  readonly className?: string;
  readonly accessibilityRole?: TextProps['accessibilityRole'];
}

const variantClasses: Record<TypographyVariant, string> = {
  'display-xl': 'text-[72px] leading-[80px] font-ultralight tracking-tighter',
  'display-lg': 'text-[44px] leading-[48px] font-black tracking-tight',
  'display-md': 'text-[32px] leading-[36px] font-black tracking-tight',
  h1: 'text-[28px] leading-[32px] font-bold',
  h2: 'text-[22px] leading-[28px] font-semibold',
  h3: 'text-[18px] leading-[24px] font-semibold',
  body: 'text-[16px] leading-[22px]',
  'body-md': 'text-[16px] leading-[22px] font-medium',
  caption: 'text-[14px] leading-[20px]',
  label: 'text-[12px] leading-[16px] font-medium uppercase tracking-[0.12em]',
};

const toneClasses: Record<TypographyTone, string> = {
  ink: 'text-ink',
  muted: 'text-ink-muted',
  faint: 'text-ink-faint',
  signal: 'text-signal',
  danger: 'text-danger',
};

const alignClasses: Record<TypographyAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export function Typography({
  children,
  variant = 'body',
  tone = 'ink',
  align = 'left',
  numeric = false,
  className = '',
  accessibilityRole,
}: TypographyProps): JSX.Element {
  return (
    <Text
      accessibilityRole={accessibilityRole}
      style={numeric ? { fontVariant: ['tabular-nums'] } : undefined}
      className={`${variantClasses[variant]} ${toneClasses[tone]} ${alignClasses[align]} ${className}`}
    >
      {children}
    </Text>
  );
}
