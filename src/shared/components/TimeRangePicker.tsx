import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { View } from 'react-native';
import { useIsDark, useThemeColors } from '../design/theme';
import { Typography } from './Typography';

interface TimeRangePickerProps {
  readonly start: Date;
  readonly end: Date;
  readonly onStartChange: (next: Date) => void;
  readonly onEndChange: (next: Date) => void;
  readonly disabled?: boolean;
}

export function TimeRangePicker({
  start,
  end,
  onStartChange,
  onEndChange,
  disabled = false,
}: TimeRangePickerProps): JSX.Element {
  const colors = useThemeColors();
  const isDark = useIsDark();

  return (
    <View className="flex-row gap-4 justify-between bg-surface-sunken/60 rounded-2xl px-6 py-5 items-center">
      <Cell
        label="Starts"
        align="start"
        value={start}
        onChange={onStartChange}
        isDark={isDark}
        inkColor={colors.ink}
        disabled={disabled}
      />
      <View className="w-[1px] h-10 bg-divider/20" />
      <Cell
        label="Ends"
        align="end"
        value={end}
        onChange={onEndChange}
        isDark={isDark}
        inkColor={colors.ink}
        disabled={disabled}
      />
    </View>
  );
}

function Cell({
  label,
  align,
  value,
  onChange,
  isDark,
  inkColor,
  disabled,
}: {
  label: string;
  align: 'start' | 'end';
  value: Date;
  onChange: (next: Date) => void;
  isDark: boolean;
  inkColor: string;
  disabled: boolean;
}): JSX.Element {
  const handle = (_: DateTimePickerEvent, next: Date | undefined): void => {
    if (next) onChange(next);
  };
  return (
    <View
      className={`gap-1 ${align === 'start' ? 'items-start' : 'items-end'}`}
    >
      <Typography variant="label" tone="faint">
        {label}
      </Typography>
      <DateTimePicker
        value={value}
        mode="time"
        display="default"
        themeVariant={isDark ? 'dark' : 'light'}
        onChange={handle}
        disabled={disabled}
        textColor={inkColor}
      />
    </View>
  );
}
