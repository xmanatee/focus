import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { View } from 'react-native';
import { useIsDark, useThemeColors } from '../design/theme';
import { Typography } from './Typography';

// @react-native-community/datetimepicker (iOS) inflates the picker's measured
// width by 10pt in RNDateTimePickerShadowView.m (`size.width += 10`). The
// native UIDatePicker chip renders at the trailing edge of that frame, so the
// inflation surfaces as empty padding on the leading edge. Counter it on the
// start side so the chip aligns with the rest of the form.
const PICKER_LEADING_INFLATION = 10;

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
    <View className="flex-row items-end justify-between">
      <Cell
        label="Starts"
        align="start"
        value={start}
        onChange={onStartChange}
        isDark={isDark}
        inkColor={colors.ink}
        disabled={disabled}
      />
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
  const isStart = align === 'start';
  return (
    <View className={`gap-2 ${isStart ? 'items-start' : 'items-end'}`}>
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
        style={{
          marginLeft: isStart ? -PICKER_LEADING_INFLATION : 0,
          transform: [{ scale: 1.2 }],
          transformOrigin: isStart ? '0% 50%' : '100% 50%',
        }}
      />
    </View>
  );
}
