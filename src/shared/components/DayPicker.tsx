import { Pressable, View } from 'react-native';
import type { DayOfWeek } from '../../features/schedule/types';
import { DAYS } from '../days';
import { haptic } from '../design/haptics';
import { Typography } from './Typography';

interface DayPickerProps {
  readonly selected: readonly DayOfWeek[];
  readonly onToggle: (day: DayOfWeek) => void;
  readonly disabled?: boolean;
}

export function DayPicker({
  selected,
  onToggle,
  disabled = false,
}: DayPickerProps): JSX.Element {
  return (
    <View className="flex-row justify-between">
      {DAYS.map((day) => {
        const active = selected.includes(day.value);
        return (
          <Pressable
            key={day.value}
            onPress={() => {
              void haptic.select();
              onToggle(day.value);
            }}
            disabled={disabled}
            className={`h-10 w-10 items-center justify-center rounded-full ${
              active ? 'bg-signal' : 'bg-surface-sunken'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <Typography variant="caption" tone={active ? 'surface' : 'muted'}>
              {day.label.charAt(0)}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}
