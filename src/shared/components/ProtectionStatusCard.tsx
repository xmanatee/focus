import { Pressable, View } from 'react-native';
import { protectionCopy } from '../../features/protection/copy';
import type { ProtectionPosture } from '../../features/protection/types';
import { haptic } from '../design/haptics';
import { DefenseDotsRow } from './DefenseDotsRow';
import { Icon } from './Icon';
import { Typography } from './Typography';

interface ProtectionStatusCardProps {
  readonly posture: ProtectionPosture;
  readonly onPress: () => void;
}

const subtitleByScore: Record<ProtectionPosture['score'], string> = {
  none: protectionCopy.statusCard.none,
  partial: protectionCopy.statusCard.partial,
  full: protectionCopy.statusCard.full,
};

export function ProtectionStatusCard({
  posture,
  onPress,
}: ProtectionStatusCardProps): JSX.Element {
  return (
    <Pressable
      onPress={() => {
        void haptic.select();
        onPress();
      }}
      className="bg-surface-raised rounded-[32px] p-card gap-3"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Icon
            name="shield.fill"
            size={20}
            tone={posture.score === 'none' ? 'muted' : 'signal'}
          />
          <Typography variant="h3" tone="ink">
            {protectionCopy.statusCard.title}
          </Typography>
        </View>
        <Icon name="chevron.right" size={16} tone="faint" />
      </View>

      <DefenseDotsRow defenses={posture.defenses} />

      <Typography variant="body" tone="muted">
        {subtitleByScore[posture.score]}
      </Typography>
    </Pressable>
  );
}
