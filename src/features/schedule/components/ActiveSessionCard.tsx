import { Pressable, View } from 'react-native';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { formatRelative, nextOccurrenceOf } from '../../../shared/days';
import { haptic } from '../../../shared/design/haptics';
import type { FocusBlock } from '../types';

interface ActiveSessionCardProps {
  readonly block: FocusBlock;
  readonly now: Date;
  readonly onEmergencyExit?: () => void;
}

export function ActiveSessionCard({
  block,
  now,
  onEmergencyExit,
}: ActiveSessionCardProps): JSX.Element {
  return (
    <View className="bg-ink rounded-[32px] p-5 gap-3 shadow-xl">
      <View className="flex-row items-center justify-between">
        <Typography variant="label" tone="surface" className="opacity-70">
          Active Session
        </Typography>
        {block.strict && (
          <View className="flex-row items-center gap-1 bg-surface/10 rounded-md px-2 py-0.5">
            <Icon name="lock.fill" size={10} tone="surface" />
            <Typography variant="caption" tone="surface">
              Strict
            </Typography>
          </View>
        )}
      </View>

      <Typography variant="display-md" tone="surface">
        {block.name}
      </Typography>
      <Typography variant="body" tone="surface" className="opacity-70">
        Ends at {block.endTime} ·{' '}
        {formatRelative(nextOccurrenceOf(block.endTime, now), now)}
      </Typography>

      {onEmergencyExit ? (
        <Pressable
          onPress={() => {
            void haptic.select();
            onEmergencyExit();
          }}
          className="self-start mt-2 px-4 py-2 rounded-full border border-surface/30"
        >
          <Typography variant="body-md" tone="surface">
            Emergency exit
          </Typography>
        </Pressable>
      ) : null}
    </View>
  );
}
