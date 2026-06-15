import { View } from 'react-native';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { DayPicker } from '../../../shared/components/DayPicker';
import { NotifyRow } from '../../../shared/components/NotifyRow';
import { TimeRangePicker } from '../../../shared/components/TimeRangePicker';
import { Typography } from '../../../shared/components/Typography';
import type { DayOfWeek } from '../../schedule/types';
import type { AdminState, SetupBlock } from '../adminState';
import { describeNextUnlock } from '../lockInCopy';

interface SetupBlockEditorCardProps {
  readonly endDate: Date;
  readonly error: string | null;
  readonly existing: SetupBlock | null;
  readonly isEnabledOnDevice: boolean;
  readonly isLoading: boolean;
  readonly now: Date;
  readonly notifyOnStart: boolean;
  readonly onChangeEnd: (value: Date) => void;
  readonly onChangeNotifyOnStart: (value: boolean) => void;
  readonly onChangeStart: (value: Date) => void;
  readonly onRemove: () => void;
  readonly onSaveAndEnable: () => void;
  readonly onSaveOnly: () => void;
  readonly onToggleDay: (day: DayOfWeek) => void;
  readonly onTurnOff: () => void;
  readonly selectedDays: readonly DayOfWeek[];
  readonly startDate: Date;
  readonly state: AdminState;
}

export function SetupBlockEditorCard({
  endDate,
  error,
  existing,
  isEnabledOnDevice,
  isLoading,
  now,
  notifyOnStart,
  onChangeEnd,
  onChangeNotifyOnStart,
  onChangeStart,
  onRemove,
  onSaveAndEnable,
  onSaveOnly,
  onToggleDay,
  onTurnOff,
  selectedDays,
  startDate,
  state,
}: SetupBlockEditorCardProps): JSX.Element {
  const isUnlocked = state.kind === 'unlocked';
  const statusLabel =
    existing === null
      ? 'Off'
      : !isEnabledOnDevice
        ? 'Off here'
        : isUnlocked
          ? 'Editable'
          : 'Locked';
  const statusClassName =
    !isEnabledOnDevice || existing === null ? 'bg-surface-sunken' : 'bg-signal';
  const statusTone =
    !isEnabledOnDevice || existing === null ? 'muted' : 'surface';

  return (
    <Card>
      <View className="flex-row items-center justify-between">
        <Typography variant="h3" tone="ink">
          Setup Block
        </Typography>
        <View className={`rounded-full px-3 py-1 ${statusClassName}`}>
          <Typography variant="caption" tone={statusTone}>
            {statusLabel}
          </Typography>
        </View>
      </View>

      {existing !== null && state.kind === 'locked' ? (
        <Typography variant="caption" tone="muted">
          {describeNextUnlock(state, existing, now)}
        </Typography>
      ) : existing !== null && !isEnabledOnDevice ? (
        <Typography variant="caption" tone="muted">
          This synced setup window stays off here until you explicitly turn it
          on.
        </Typography>
      ) : null}

      <View className="h-[1px] bg-divider" />

      <View className="gap-2">
        <Typography variant="label" tone="faint">
          Active Days
        </Typography>
        <DayPicker
          selected={selectedDays}
          onToggle={onToggleDay}
          disabled={!isUnlocked}
        />
      </View>

      <View className="h-[1px] bg-divider" />

      <TimeRangePicker
        start={startDate}
        end={endDate}
        onStartChange={onChangeStart}
        onEndChange={onChangeEnd}
        disabled={!isUnlocked}
      />

      <View className="h-[1px] bg-divider" />

      <NotifyRow
        title="Setup Reminder"
        subtitle="Alert when this setup block begins."
        value={notifyOnStart}
        onChange={onChangeNotifyOnStart}
        disabled={!isUnlocked}
      />

      {error ? (
        <Typography variant="caption" tone="danger">
          {error}
        </Typography>
      ) : null}

      <View className="gap-2 pt-1">
        <Button
          title={
            existing === null || !isEnabledOnDevice
              ? 'Save and turn on here'
              : 'Update setup block'
          }
          variant="commit"
          onPress={
            existing === null || !isEnabledOnDevice
              ? onSaveAndEnable
              : onSaveOnly
          }
          isLoading={isLoading}
          disabled={isLoading || !isUnlocked}
        />
        {existing !== null && !isEnabledOnDevice ? (
          <Button
            title="Save without turning on"
            variant="ghost"
            onPress={onSaveOnly}
            disabled={isLoading || !isUnlocked}
          />
        ) : null}
        {existing !== null && isEnabledOnDevice ? (
          <Button
            title="Turn off on this device"
            variant="ghost"
            onPress={onTurnOff}
            disabled={isLoading || !isUnlocked}
          />
        ) : null}
        {existing !== null ? (
          <Button
            title="Remove setup block"
            variant="abandon"
            onPress={onRemove}
            disabled={isLoading || !isUnlocked}
          />
        ) : null}
      </View>
    </Card>
  );
}
