import { View } from 'react-native';
import { Chip } from '../../../shared/components/Chip';
import { Section } from '../../../shared/components/Section';
import { Typography } from '../../../shared/components/Typography';
import type { PresetKind } from '../presets';

interface PresetRowProps {
  readonly onSelect: (kind: PresetKind) => void;
  readonly onLongPress: (kind: PresetKind) => void;
  readonly disabled?: boolean;
}

const ENTRIES: readonly { kind: PresetKind; label: string }[] = [
  { kind: 'work', label: 'Deep Work' },
  { kind: 'study', label: 'Study' },
  { kind: 'socialBudget', label: 'Social Budget' },
  { kind: 'youtube', label: 'YouTube Limit' },
  { kind: 'evening', label: 'Evening' },
  { kind: 'weekend', label: 'Detox' },
];

export function PresetRow({
  onSelect,
  onLongPress,
  disabled = false,
}: PresetRowProps): JSX.Element {
  return (
    <Section title="Presets">
      <View className="gap-2">
        <View className="flex-row flex-wrap gap-2">
          {ENTRIES.map(({ kind, label }) => (
            <Chip
              key={kind}
              label={label}
              onPress={() => onSelect(kind)}
              onLongPress={() => onLongPress(kind)}
              disabled={disabled}
            />
          ))}
        </View>
        <Typography variant="caption" tone="muted">
          Tap to reuse a preset. Hold a preset to update the saved app group
          behind it.
        </Typography>
      </View>
    </Section>
  );
}
