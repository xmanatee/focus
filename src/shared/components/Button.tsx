import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { color, motion } from '../design/theme';
import { Typography } from './Typography';

type ButtonVariant = 'primary' | 'commit' | 'ghost' | 'abandon';
type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly isLoading?: boolean;
  readonly disabled?: boolean;
  readonly leading?: React.ReactNode;
}

const PressableAnimated = Animated.createAnimatedComponent(Pressable);

const containerClasses: Record<ButtonVariant, string> = {
  primary: 'bg-ink',
  commit: 'bg-signal',
  ghost: 'bg-transparent border border-divider',
  abandon: 'bg-transparent',
};

const textToneByVariant: Record<
  ButtonVariant,
  'ink' | 'muted' | 'faint' | 'signal' | 'danger'
> = {
  primary: 'faint',
  commit: 'ink',
  ghost: 'ink',
  abandon: 'muted',
};

const spinnerColor: Record<ButtonVariant, string> = {
  primary: color.surface,
  commit: color.ink,
  ghost: color.ink,
  abandon: color.inkMuted,
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'py-3 px-5 rounded-lg',
  lg: 'py-4 px-6 rounded-lg',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  disabled = false,
  leading,
}: ButtonProps): JSX.Element {
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

  const variantTextTone =
    variant === 'primary' ? 'ink' : textToneByVariant[variant];
  const textClassName =
    variant === 'primary'
      ? 'text-surface'
      : variant === 'commit'
        ? 'text-surface'
        : '';

  return (
    <PressableAnimated
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={pressableStyle}
      className={`${containerClasses[variant]} ${
        sizeClasses[size]
      } items-center justify-center ${isDisabled ? 'opacity-40' : ''}`}
    >
      {isLoading ? (
        <ActivityIndicator color={spinnerColor[variant]} />
      ) : (
        <View className="flex-row items-center gap-2">
          {leading}
          <Typography
            variant="body-md"
            tone={
              variant === 'primary' || variant === 'commit'
                ? 'ink'
                : variantTextTone
            }
            className={textClassName}
          >
            {title}
          </Typography>
        </View>
      )}
    </PressableAnimated>
  );
}
