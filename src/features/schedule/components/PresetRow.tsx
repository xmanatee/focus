import { Pressable, View } from 'react-native';
import { Typography } from '../../../shared/components/Typography';
import type { PresetKind } from '../presets';

interface PresetRowProps {
  readonly onSelect: (kind: PresetKind) => void;
}

export function PresetRow({ onSelect }: PresetRowProps): JSX.Element {
  return (
    <View className="gap-3">
      <Typography variant="label" tone="faint">
        Presets
      </Typography>
      <View className="flex-row gap-2">
        <Chip label="Deep Work" onPress={() => onSelect('work')} />
        <Chip label="Evening" onPress={() => onSelect('evening')} />
        <Chip label="Weekend" onPress={() => onSelect('weekend')} />
      </View>
    </View>
  );
}

function Chip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface-raised px-5 py-3 rounded-full border border-divider/50"
    >
      <Typography variant="body-md" tone="muted">
        {label}
      </Typography>
    </Pressable>
  );
}
