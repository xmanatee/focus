import { Text, type TextProps } from 'react-native';

type TypographyVariant =
  | 'display-md'
  | 'h3'
  | 'body'
  | 'body-md'
  | 'caption'
  | 'label';

type TypographyTone =
  | 'ink'
  | 'muted'
  | 'faint'
  | 'signal'
  | 'danger'
  | 'surface';

type TypographyAlign = 'left' | 'center' | 'right';

interface TypographyProps {
  readonly children: React.ReactNode;
  readonly variant?: TypographyVariant;
  readonly tone?: TypographyTone;
  readonly align?: TypographyAlign;
  readonly className?: string;
  readonly accessibilityRole?: TextProps['accessibilityRole'];
}

const variantClasses: Record<TypographyVariant, string> = {
  'display-md': 'text-[32px] leading-[36px] font-black tracking-tight',
  h3: 'text-[18px] leading-[24px] font-semibold',
  body: 'text-[16px] leading-[22px]',
  'body-md': 'text-[17px] leading-[22px] font-semibold',
  caption: 'text-[14px] leading-[20px]',
  label: 'text-[12px] leading-[16px] font-semibold uppercase tracking-[0.14em]',
};

const toneClasses: Record<TypographyTone, string> = {
  ink: 'text-ink',
  muted: 'text-ink-muted',
  faint: 'text-ink-faint',
  signal: 'text-signal',
  danger: 'text-danger',
  surface: 'text-surface',
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
  className = '',
  accessibilityRole,
}: TypographyProps): JSX.Element {
  return (
    <Text
      accessibilityRole={accessibilityRole}
      className={`${variantClasses[variant]} ${toneClasses[tone]} ${alignClasses[align]} ${className}`}
    >
      {children}
    </Text>
  );
}
