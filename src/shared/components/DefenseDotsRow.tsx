import { View } from 'react-native';
import type { ProtectionPosture } from '../../features/protection/types';

interface DefenseDotsRowProps {
  readonly defenses: ProtectionPosture['defenses'];
}

export function DefenseDotsRow({ defenses }: DefenseDotsRowProps): JSX.Element {
  return (
    <View className="flex-row gap-1.5">
      {defenses.map((d) => (
        <View
          key={d.id}
          className={`h-2 flex-1 rounded-full ${
            d.ok ? 'bg-signal' : 'bg-divider'
          }`}
        />
      ))}
    </View>
  );
}
