import { useCallback } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion, useThemeColors } from '../design/theme';
import { Typography } from './Typography';

type ButtonVariant = 'commit' | 'ghost' | 'abandon';

interface ButtonProps {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant: ButtonVariant;
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
}

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

const containerClasses: Record<ButtonVariant, string> = {
  commit: 'bg-signal',
  ghost: 'bg-transparent border-[1.5px] border-divider',
  abandon: 'bg-transparent',
};

const textTone: Record<ButtonVariant, 'surface' | 'ink' | 'muted'> = {
  commit: 'surface',
  ghost: 'ink',
  abandon: 'muted',
};

export function Button({
  title,
  onPress,
  variant,
  isLoading = false,
  disabled = false,
}: ButtonProps): JSX.Element {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const isDisabled = disabled || isLoading;

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: motion.fast });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: motion.fast });
  }, [scale]);

  const pressableStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const spinnerColor = variant === 'commit' ? colors.surface : colors.ink;

  return (
    <PressableAnimated
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={pressableStyle}
      className={`${
        containerClasses[variant]
      } rounded-full py-4 px-6 items-center justify-center ${
        isDisabled ? 'opacity-40' : ''
      }`}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Typography variant="body-md" tone={textTone[variant]}>
          {title}
        </Typography>
      )}
    </PressableAnimated>
  );
}
