import { Pressable, View } from 'react-native';
import { haptic } from '../design/haptics';
import { Icon } from './Icon';
import { Typography } from './Typography';

interface StepHeaderProps {
  readonly step: number;
  readonly total: number;
  readonly title: string;
  readonly onClose: () => void;
}

export function StepHeader({
  step,
  total,
  title,
  onClose,
}: StepHeaderProps): JSX.Element {
  return (
    <View className="gap-3">
      <View className="flex-row justify-between items-center">
        <Typography variant="label" tone="faint">
          Step {step} of {total}
        </Typography>
        <Pressable
          onPress={() => {
            void haptic.select();
            onClose();
          }}
          hitSlop={12}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface-sunken"
        >
          <Icon name="xmark" size={16} tone="muted" />
        </Pressable>
      </View>
      <Typography variant="display-md" tone="ink">
        {title}
      </Typography>
    </View>
  );
}
