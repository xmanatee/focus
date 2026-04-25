import { Pressable } from 'react-native';
import { Typography } from './Typography';

interface ChipProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly onLongPress?: () => void;
  readonly active?: boolean;
}

export function Chip({
  label,
  onPress,
  onLongPress,
  active = false,
}: ChipProps): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className={`px-4 py-3 rounded-full border ${
        active
          ? 'bg-signal border-signal'
          : 'bg-surface-raised border-divider/50'
      }`}
    >
      <Typography variant="body-md" tone={active ? 'surface' : 'muted'}>
        {label}
      </Typography>
    </Pressable>
  );
}
