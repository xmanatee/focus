import { Pressable, Switch, View } from 'react-native';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { formatActiveDays } from '../../../shared/days';
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
    <View className="bg-surface-raised rounded-[32px] p-card gap-3">
      <View className="flex-row justify-between items-start">
        <Pressable onPress={onPress} disabled={locked} className="flex-1 gap-2">
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
          <Typography variant="caption" tone="muted">
            {formatActiveDays(block.days)} · {block.startTime}–{block.endTime}
          </Typography>
          <View className="flex-row items-center gap-2">
            <SelectionPill
              icon="app.badge"
              label={
                selection.activitySelection.status === 'saved'
                  ? `${selection.activitySelection.applicationCount} apps`
                  : '0 apps'
              }
            />
            {selection.webDomains.length > 0 && (
              <SelectionPill
                icon="globe"
                label={`${selection.webDomains.length} sites`}
              />
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

function SelectionPill({
  icon,
  label,
}: {
  icon: 'app.badge' | 'globe';
  label: string;
}): JSX.Element {
  return (
    <View className="bg-surface-sunken px-3 py-1.5 rounded-full flex-row items-center gap-2">
      <Icon name={icon} size={12} tone="muted" />
      <Typography variant="caption" tone="muted">
        {label}
      </Typography>
    </View>
  );
}
