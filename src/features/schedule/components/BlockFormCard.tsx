import { TextInput, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { DayPicker } from '../../../shared/components/DayPicker';
import { TimeRangePicker } from '../../../shared/components/TimeRangePicker';
import { Typography } from '../../../shared/components/Typography';
import { useThemeColors } from '../../../shared/design/theme';
import type { DayOfWeek } from '../types';

interface BlockFormCardProps {
  readonly name: string;
  readonly onNameChange: (next: string) => void;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly onStartChange: (next: Date) => void;
  readonly onEndChange: (next: Date) => void;
  readonly selectedDays: readonly DayOfWeek[];
  readonly onToggleDay: (day: DayOfWeek) => void;
  readonly disabled?: boolean;
}

export function BlockFormCard({
  name,
  onNameChange,
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  selectedDays,
  onToggleDay,
  disabled = false,
}: BlockFormCardProps): JSX.Element {
  const colors = useThemeColors();

  return (
    <Card>
      <View className="gap-2">
        <Typography variant="label" tone="faint">
          Block Name
        </Typography>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="e.g. Morning Deep Work"
          placeholderTextColor={colors.inkFaint}
          editable={!disabled}
          className="text-[22px] font-semibold"
          style={{ color: colors.ink }}
        />
      </View>

      <View className="h-[1px] bg-divider" />

      <TimeRangePicker
        start={startDate}
        end={endDate}
        onStartChange={onStartChange}
        onEndChange={onEndChange}
        disabled={disabled}
      />

      <View className="h-[1px] bg-divider" />

      <View className="gap-2">
        <Typography variant="label" tone="faint">
          Repeat
        </Typography>
        <DayPicker
          selected={selectedDays}
          onToggle={onToggleDay}
          disabled={disabled}
        />
      </View>
    </Card>
  );
}
