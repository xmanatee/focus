import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { haptic } from '../design/haptics';

type CardTone = 'raised' | 'ink' | 'signal' | 'dashed';

interface CardProps {
  readonly tone?: CardTone;
  readonly onPress?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

const toneClasses: Record<CardTone, string> = {
  raised: 'bg-surface-raised border border-divider/10',
  ink: 'bg-ink shadow-xl',
  signal: 'bg-signal/10 border border-signal/20',
  dashed: 'bg-surface-raised/50 border border-divider/30 border-dashed',
};

const BASE = 'rounded-2xl p-card gap-3';

export function Card({
  tone = 'raised',
  onPress,
  disabled = false,
  className = '',
  children,
}: CardProps): JSX.Element {
  const classes = `${BASE} ${toneClasses[tone]} ${
    disabled ? 'opacity-50' : ''
  } ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          void haptic.select();
          onPress();
        }}
        disabled={disabled}
        className={classes}
      >
        {children}
      </Pressable>
    );
  }

  return <View className={classes}>{children}</View>;
}
