import { View } from 'react-native';
import { Chip } from '../../../shared/components/Chip';
import { Typography } from '../../../shared/components/Typography';
import type { PresetKind } from '../presets';

interface PresetRowProps {
  readonly onSelect: (kind: PresetKind) => void;
  readonly onLongPress: (kind: PresetKind) => void;
}

const ENTRIES: readonly { kind: PresetKind; label: string }[] = [
  { kind: 'work', label: 'Deep Work' },
  { kind: 'evening', label: 'Evening' },
  { kind: 'weekend', label: 'Weekend' },
];

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
        {ENTRIES.map(({ kind, label }) => (
          <Chip
            key={kind}
            label={label}
            onPress={() => onSelect(kind)}
            onLongPress={() => onLongPress(kind)}
          />
        ))}
      </View>
    </View>
  );
}
