import {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Pressable, View } from 'react-native';
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
}: TimeRangePickerProps): React.JSX.Element {
  return (
    <View className="flex-row gap-3">
      <Cell
        label="Starts"
        value={start}
        onChange={onStartChange}
        disabled={disabled}
      />
      <Cell
        label="Ends"
        value={end}
        onChange={onEndChange}
        disabled={disabled}
      />
    </View>
  );
}

function Cell({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  disabled: boolean;
}): React.JSX.Element {
  const formatted = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value);

  const open = (): void => {
    DateTimePickerAndroid.open({
      value,
      mode: 'time',
      display: 'default',
      onChange: (event: DateTimePickerEvent, next: Date | undefined) => {
        if (event.type === 'set' && next) onChange(next);
      },
    });
  };

  return (
    <View className="flex-1 gap-2">
      <Typography variant="label" tone="faint">
        {label}
      </Typography>
      <Pressable
        accessibilityLabel={`${label}, ${formatted}`}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={open}
        className={`min-h-12 items-center justify-center rounded-xl bg-surface-sunken px-4 ${
          disabled ? 'opacity-40' : ''
        }`}
      >
        <Typography variant="body-md" tone="ink">
          {formatted}
        </Typography>
      </Pressable>
    </View>
  );
}
