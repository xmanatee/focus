import type { SymbolViewProps } from 'expo-symbols';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { Typography } from './Typography';

type InfoBannerVariant = 'info' | 'warn';

interface InfoBannerProps {
  readonly variant: InfoBannerVariant;
  readonly title?: string;
  readonly children: ReactNode;
}

const containerByVariant: Record<InfoBannerVariant, string> = {
  info: 'bg-surface-sunken',
  warn: 'bg-signal/10 border border-signal/20',
};

const iconByVariant: Record<InfoBannerVariant, SymbolViewProps['name']> = {
  info: 'info.circle',
  warn: 'exclamationmark.triangle.fill',
};

const iconToneByVariant: Record<InfoBannerVariant, 'muted' | 'signal'> = {
  info: 'muted',
  warn: 'signal',
};

export function InfoBanner({
  variant,
  title,
  children,
}: InfoBannerProps): JSX.Element {
  return (
    <View
      className={`rounded-2xl p-card gap-2 flex-row items-start ${containerByVariant[variant]}`}
    >
      <View className="pt-0.5">
        <Icon
          name={iconByVariant[variant]}
          size={18}
          tone={iconToneByVariant[variant]}
        />
      </View>
      <View className="flex-1 gap-1">
        {title ? (
          <Typography variant="body-md" tone="ink">
            {title}
          </Typography>
        ) : null}
        {typeof children === 'string' ? (
          <Typography variant="caption" tone="muted">
            {children}
          </Typography>
        ) : (
          children
        )}
      </View>
    </View>
  );
}
