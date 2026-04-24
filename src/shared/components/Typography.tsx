import { Text } from 'react-native';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function Typography({
  children,
  variant = 'body',
  align = 'left',
  className = '',
}: TypographyProps): JSX.Element {
  const variantClasses = {
    h1: 'text-4xl font-extrabold text-text tracking-tight',
    h2: 'text-2xl font-bold text-text',
    h3: 'text-xl font-semibold text-text',
    body: 'text-base text-text',
    caption: 'text-sm text-textMuted',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <Text
      className={`${variantClasses[variant]} ${alignClasses[align]} ${className}`}
    >
      {children}
    </Text>
  );
}
