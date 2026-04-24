import { Pressable, Switch, View } from 'react-native';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { useThemeColors } from '../../../shared/design/theme';
import type { FocusBlock } from '../types';

interface FocusBlockRowProps {
  readonly block: FocusBlock;
  readonly isActive: boolean;
  readonly locked: boolean;
  readonly onPress: () => void;
  readonly onToggle: (next: boolean) => void;
}

export function FocusBlockRow({
  block,
  isActive,
  locked,
  onPress,
  onToggle,
}: FocusBlockRowProps): JSX.Element {
  const colors = useThemeColors();
  const { selection } = block;

  return (
    <View className="bg-surface-raised rounded-[32px] p-6 gap-4">
      <View className="flex-row justify-between items-start">
        <Pressable onPress={onPress} disabled={locked} className="flex-1">
          <View className="flex-row items-center gap-2">
            <Typography variant="h3" tone="ink">
              {block.name}
            </Typography>
            {isActive && (
              <View className="bg-signal/20 px-2 py-0.5 rounded-md">
                <Typography variant="caption" tone="signal">
                  Active
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="caption" tone="muted" className="mt-1">
            {block.days.join(' · ').toUpperCase()} · {block.startTime}–
            {block.endTime}
          </Typography>
          <View className="flex-row items-center gap-3 mt-3">
            <View className="bg-surface-sunken px-3 py-1.5 rounded-full flex-row items-center gap-2">
              <Icon name="app.badge" size={12} tone="muted" />
              <Typography variant="caption" tone="muted">
                {selection.activitySelection.status === 'saved'
                  ? `${selection.activitySelection.applicationCount} apps`
                  : '0 apps'}
              </Typography>
            </View>
            {selection.webDomains.length > 0 && (
              <View className="bg-surface-sunken px-3 py-1.5 rounded-full flex-row items-center gap-2">
                <Icon name="globe" size={12} tone="muted" />
                <Typography variant="caption" tone="muted">
                  {selection.webDomains.length} sites
                </Typography>
              </View>
            )}
          </View>
        </Pressable>
        <Switch
          value={block.isEnabled}
          onValueChange={onToggle}
          disabled={locked}
          trackColor={{ true: colors.signal, false: colors.divider }}
        />
      </View>
    </View>
  );
}
