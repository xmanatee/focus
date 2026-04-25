import { Pressable, Switch, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { formatActiveDays } from '../../../shared/days';
import { useThemeColors } from '../../../shared/design/theme';
import { summarizeActivitySelection } from '../../blocker/types';
import type { FocusBlock } from '../types';

interface FocusBlockRowProps {
  readonly block: FocusBlock;
  readonly isActive: boolean;
  readonly toggleDisabled: boolean;
  readonly onPress: () => void;
  readonly onToggle: (next: boolean) => void;
}

export function FocusBlockRow({
  block,
  isActive,
  toggleDisabled,
  onPress,
  onToggle,
}: FocusBlockRowProps): JSX.Element {
  const colors = useThemeColors();
  const { selection } = block;

  return (
    <Card>
      <View className="flex-row justify-between items-start">
        <Pressable onPress={onPress} className="flex-1 gap-2">
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
            {block.strict && (
              <View className="bg-ink/10 px-2 py-0.5 rounded-md flex-row items-center gap-1">
                <Icon name="lock.fill" size={10} tone="muted" />
                <Typography variant="caption" tone="muted">
                  Strict
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="caption" tone="muted">
            {formatActiveDays(block.days)} · {block.startTime}–{block.endTime}
          </Typography>
          <View className="flex-row items-center gap-2 flex-wrap">
            {selection.activitySelection.status === 'saved' && (
              <SelectionPill
                icon="square.grid.2x2.fill"
                label={summarizeActivitySelection(selection.activitySelection)}
              />
            )}
            {selection.webDomains.length > 0 && (
              <SelectionPill
                icon="globe"
                label={`${selection.webDomains.length} ${
                  selection.webDomains.length === 1 ? 'site' : 'sites'
                }`}
              />
            )}
            {selection.activitySelection.status !== 'saved' &&
              selection.webDomains.length === 0 && (
                <SelectionPill icon="app.badge" label="None" />
              )}
          </View>
        </Pressable>
        <Switch
          value={block.isEnabled}
          onValueChange={onToggle}
          disabled={toggleDisabled}
          trackColor={{ true: colors.signal, false: colors.divider }}
        />
      </View>
    </Card>
  );
}

function SelectionPill({
  icon,
  label,
}: {
  icon: 'app.badge' | 'globe' | 'square.grid.2x2.fill';
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
