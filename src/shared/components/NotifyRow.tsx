import { Switch, View } from 'react-native';
import { useThemeColors } from '../design/theme';
import { Typography } from './Typography';

interface NotifyRowProps {
  readonly title: string;
  readonly subtitle: string;
  readonly value: boolean;
  readonly onChange: (next: boolean) => void;
  readonly disabled?: boolean;
}

export function NotifyRow({
  title,
  subtitle,
  value,
  onChange,
  disabled = false,
}: NotifyRowProps): JSX.Element {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center justify-between">
      <View className="gap-1 flex-1 mr-4">
        <Typography variant="body-md" tone="ink">
          {title}
        </Typography>
        <Typography variant="caption" tone="muted">
          {subtitle}
        </Typography>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: colors.signal, false: colors.divider }}
      />
    </View>
  );
}
