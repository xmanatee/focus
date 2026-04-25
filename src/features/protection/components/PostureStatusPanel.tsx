import { View } from 'react-native';
import { DefenseDotsRow } from '../../../shared/components/DefenseDotsRow';
import { Typography } from '../../../shared/components/Typography';
import { useProtectionPosture } from '../useProtectionPosture';

export function PostureStatusPanel(): JSX.Element {
  const posture = useProtectionPosture();
  return (
    <View className="gap-3 bg-surface-raised rounded-3xl p-card border border-divider/10">
      <Typography variant="label" tone="faint">
        Status
      </Typography>
      <DefenseDotsRow defenses={posture.defenses} />
    </View>
  );
}
