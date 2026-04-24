import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '../design/theme';

interface HairlineBarProps {
  readonly progress: number;
  readonly tone?: 'signal' | 'ink';
}

export function HairlineBar({
  progress,
  tone = 'signal',
}: HairlineBarProps): JSX.Element {
  const clamped = Math.max(0, Math.min(1, progress));

  const fillStyle = useAnimatedStyle(() => ({
    width: `${withTiming(clamped * 100, {
      duration: motion.base,
      easing: motion.easeOut,
    })}%`,
  }));

  const fillClass = tone === 'signal' ? 'bg-signal' : 'bg-ink';

  return (
    <View className="h-[2px] w-full bg-divider overflow-hidden">
      <Animated.View style={fillStyle} className={`h-full ${fillClass}`} />
    </View>
  );
}
