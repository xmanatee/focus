import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '../../../../shared/components/Button';
import { Chip } from '../../../../shared/components/Chip';
import { CodeReveal } from '../../../../shared/components/CodeReveal';
import { InfoBanner } from '../../../../shared/components/InfoBanner';
import { Screen } from '../../../../shared/components/Screen';
import { StepHeader } from '../../../../shared/components/StepHeader';
import { Typography } from '../../../../shared/components/Typography';
import { haptic } from '../../../../shared/design/haptics';
import { PROTECTION_WIZARD_STEPS, protectionCopy } from '../../copy';
import type { WeeklyLimit } from '../../types';
import { useEmergencyStore } from '../../useEmergencyStore';

interface EmergencyStepProps {
  readonly onNext: () => void;
  readonly onClose: () => void;
}

const WEEKLY_OPTIONS: readonly WeeklyLimit[] = [0, 1, 2, 3];
const COOLDOWN_OPTIONS: readonly number[] = [0, 5, 15, 30, 60];

function cooldownLabel(minutes: number): string {
  if (minutes === 0) return 'None';
  if (minutes < 60) return `${minutes}m`;
  return `${minutes / 60}h`;
}

function weeklyLabel(value: WeeklyLimit): string {
  if (value === 0) return 'Off';
  return `${value}/wk`;
}

export function EmergencyStep({
  onNext,
  onClose,
}: EmergencyStepProps): JSX.Element {
  const mode = useEmergencyStore((s) => s.mode);
  const configure = useEmergencyStore((s) => s.configure);

  const [weekly, setWeekly] = useState<WeeklyLimit>(
    mode.kind === 'enabled' ? mode.weeklyLimit : 2,
  );
  const [cooldown, setCooldown] = useState<number>(
    mode.kind === 'enabled' ? mode.cooldownMinutes : 5,
  );
  const [savedCode, setSavedCode] = useState<string | null>(null);

  const handleSave = (): void => {
    void haptic.commit();
    configure({ weeklyLimit: weekly, cooldownMinutes: cooldown });
    const next = useEmergencyStore.getState().mode;
    setSavedCode(next.kind === 'enabled' ? next.currentCode : null);
  };

  return (
    <Screen padded={false} edges={['bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: 60,
          gap: 20,
        }}
      >
        <StepHeader
          step={4}
          total={PROTECTION_WIZARD_STEPS}
          title={protectionCopy.emergency.title}
          onClose={onClose}
        />

        <Typography variant="body" tone="muted">
          {protectionCopy.emergency.body}
        </Typography>

        <View className="gap-3">
          <Typography variant="label" tone="faint">
            {protectionCopy.emergency.weeklyLabel}
          </Typography>
          <View className="flex-row gap-2">
            {WEEKLY_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={weeklyLabel(opt)}
                active={weekly === opt}
                onPress={() => setWeekly(opt)}
              />
            ))}
          </View>
        </View>

        {weekly === 0 ? (
          <InfoBanner
            variant="warn"
            title={protectionCopy.emergency.zeroWarnTitle}
          >
            {protectionCopy.emergency.zeroWarn}
          </InfoBanner>
        ) : (
          <View className="gap-3">
            <Typography variant="label" tone="faint">
              {protectionCopy.emergency.cooldownLabel}
            </Typography>
            <View className="flex-row gap-2">
              {COOLDOWN_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={cooldownLabel(opt)}
                  active={cooldown === opt}
                  onPress={() => setCooldown(opt)}
                />
              ))}
            </View>
          </View>
        )}

        <Button
          title={protectionCopy.emergency.save}
          variant="commit"
          onPress={handleSave}
        />

        {savedCode ? (
          <View className="gap-3">
            <InfoBanner
              variant="warn"
              title={protectionCopy.emergency.revealTitle}
            >
              {protectionCopy.emergency.revealBody}
            </InfoBanner>
            <CodeReveal value={savedCode} />
          </View>
        ) : null}

        <Button
          title={protectionCopy.emergency.continue}
          variant="ghost"
          onPress={onNext}
        />
      </ScrollView>
    </Screen>
  );
}
