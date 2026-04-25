import { Pressable, View } from 'react-native';
import { haptic } from '../design/haptics';
import { Icon } from './Icon';
import { Typography } from './Typography';

interface ChecklistItem {
  readonly id: string;
  readonly title: string;
  readonly status: 'unset' | 'set';
}

interface ChecklistProps {
  readonly items: readonly ChecklistItem[];
  readonly onToggle: (id: string) => void;
}

export function Checklist({ items, onToggle }: ChecklistProps): JSX.Element {
  return (
    <View className="gap-2">
      {items.map((item) => {
        const isSet = item.status === 'set';
        return (
          <Pressable
            key={item.id}
            onPress={() => {
              void haptic.select();
              onToggle(item.id);
            }}
            className={`flex-row items-center gap-3 bg-surface-raised rounded-2xl p-card border ${
              isSet ? 'border-signal/40' : 'border-divider/30'
            }`}
          >
            <Icon
              name={isSet ? 'checkmark.seal.fill' : 'circle'}
              size={22}
              tone={isSet ? 'signal' : 'faint'}
            />
            <Typography variant="body-md" tone="ink" className="flex-1">
              {item.title}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}
