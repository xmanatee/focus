import { Pressable, View } from 'react-native';
import { Typography } from '../../../shared/components/Typography';
import type { PresetKind } from '../presets';

interface PresetRowProps {
  readonly onSelect: (kind: PresetKind) => void;
  readonly onLongPress: (kind: PresetKind) => void;
}

export function PresetRow({
  onSelect,
  onLongPress,
}: PresetRowProps): JSX.Element {
  return (
    <View className="gap-3">
      <Typography variant="label" tone="faint">
        Presets
      </Typography>
      <View className="flex-row gap-2">
        <Chip
          label="Deep Work"
          onPress={() => onSelect('work')}
          onLongPress={() => onLongPress('work')}
        />
        <Chip
          label="Evening"
          onPress={() => onSelect('evening')}
          onLongPress={() => onLongPress('evening')}
        />
        <Chip
          label="Weekend"
          onPress={() => onSelect('weekend')}
          onLongPress={() => onLongPress('weekend')}
        />
      </View>
    </View>
  );
}

function Chip({
  label,
  onPress,
  onLongPress,
}: {
  label: string;
  onPress: () => void;
  onLongPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      className="bg-surface-raised px-4 py-3 rounded-full border border-divider/50"
    >
      <Typography variant="body-md" tone="muted">
        {label}
      </Typography>
    </Pressable>
  );
}
