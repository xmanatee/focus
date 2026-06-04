import { Pressable, TextInput, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Section } from '../../../shared/components/Section';
import { Typography } from '../../../shared/components/Typography';
import { useThemeColors } from '../../../shared/design/theme';
import type { FocusBlockRule } from '../types';

interface RuleCardProps {
  readonly value: FocusBlockRule;
  readonly onChange: (next: FocusBlockRule) => void;
  readonly disabled?: boolean;
}

const DEFAULT_BUDGET_MINUTES = 30;

const RULES: readonly {
  readonly kind: FocusBlockRule['kind'];
  readonly title: string;
  readonly subtitle: string;
}[] = [
  {
    kind: 'blockDuringSchedule',
    title: 'Block during schedule',
    subtitle: 'Hide selected apps during the selected hours.',
  },
  {
    kind: 'allowDuringSchedule',
    title: 'Allow only during schedule',
    subtitle: 'Block selected apps outside the selected hours.',
  },
  {
    kind: 'dailyBudget',
    title: 'Daily budget',
    subtitle: 'Block after the selected apps reach a daily limit.',
  },
  {
    kind: 'allowDuringScheduleWithBudget',
    title: 'Schedule + budget',
    subtitle: 'Allow only inside the schedule and until the limit is used.',
  },
];

function minutesFor(value: FocusBlockRule): number {
  if (value.kind === 'dailyBudget') return value.minutes;
  if (value.kind === 'allowDuringScheduleWithBudget') return value.minutes;
  return DEFAULT_BUDGET_MINUTES;
}

function ruleForKind(
  kind: FocusBlockRule['kind'],
  current: FocusBlockRule,
): FocusBlockRule {
  const minutes = minutesFor(current);
  switch (kind) {
    case 'blockDuringSchedule':
      return { kind };
    case 'allowDuringSchedule':
      return { kind };
    case 'dailyBudget':
      return { kind, minutes };
    case 'allowDuringScheduleWithBudget':
      return { kind, minutes };
  }
}

function withMinutes(value: FocusBlockRule, minutes: number): FocusBlockRule {
  if (value.kind === 'dailyBudget') return { kind: value.kind, minutes };
  if (value.kind === 'allowDuringScheduleWithBudget') {
    return { kind: value.kind, minutes };
  }
  return value;
}

export function RuleCard({
  value,
  onChange,
  disabled = false,
}: RuleCardProps): JSX.Element {
  const colors = useThemeColors();
  const showsBudget =
    value.kind === 'dailyBudget' ||
    value.kind === 'allowDuringScheduleWithBudget';

  return (
    <Section title="Rule">
      <Card>
        <View className="gap-4">
          {RULES.map((rule) => (
            <Pressable
              key={rule.kind}
              onPress={
                disabled
                  ? undefined
                  : () => onChange(ruleForKind(rule.kind, value))
              }
              className="flex-row items-center gap-3"
            >
              <Icon
                name={
                  value.kind === rule.kind ? 'checkmark.circle.fill' : 'circle'
                }
                size={20}
                tone={value.kind === rule.kind ? 'signal' : 'faint'}
              />
              <View className="flex-1 gap-1">
                <Typography variant="body-md" tone="ink">
                  {rule.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {rule.subtitle}
                </Typography>
              </View>
            </Pressable>
          ))}

          {showsBudget && (
            <View className="gap-2">
              <Typography variant="label" tone="faint">
                Daily Minutes
              </Typography>
              <TextInput
                value={String(minutesFor(value))}
                onChangeText={(text) => {
                  const parsed = Number.parseInt(text, 10);
                  if (Number.isNaN(parsed)) return;
                  onChange(withMinutes(value, parsed));
                }}
                keyboardType="number-pad"
                editable={!disabled}
                className="bg-surface-sunken rounded-xl px-4 py-3 text-[18px] font-semibold"
                style={{ color: colors.ink }}
              />
            </View>
          )}
        </View>
      </Card>
    </Section>
  );
}
