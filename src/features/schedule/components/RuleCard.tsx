import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Section } from '../../../shared/components/Section';
import { Typography } from '../../../shared/components/Typography';
import { useThemeColors } from '../../../shared/design/theme';
import { BUDGET_WARNING_MINUTES, budgetMinutesError } from '../budget';
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
    subtitle: 'Selected apps are blocked inside the time window.',
  },
  {
    kind: 'allowDuringSchedule',
    title: 'Allow only during schedule',
    subtitle: 'Selected apps are blocked outside the time window.',
  },
  {
    kind: 'dailyBudget',
    title: 'Daily budget',
    subtitle: 'Selected apps are blocked after the daily limit is used.',
  },
  {
    kind: 'allowDuringScheduleWithBudget',
    title: 'Schedule + budget',
    subtitle: 'Apps are blocked outside the window and after the limit.',
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
  const budgetMinutes = minutesFor(value);
  const [budgetText, setBudgetText] = useState(String(budgetMinutes));
  const [budgetError, setBudgetError] = useState<string | null>(null);

  useEffect(() => {
    if (!showsBudget) {
      setBudgetError(null);
      return;
    }
    setBudgetText(String(budgetMinutes));
    setBudgetError(null);
  }, [budgetMinutes, showsBudget]);

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
                Daily Limit
              </Typography>
              <TextInput
                value={budgetText}
                onChangeText={(text) => {
                  setBudgetText(text);
                  const parsed = Number.parseInt(text, 10);
                  if (Number.isNaN(parsed)) {
                    setBudgetError(
                      'Daily budget must be between 1 minute and 23h 59m.',
                    );
                    return;
                  }
                  const error = budgetMinutesError(parsed);
                  if (error !== null) {
                    setBudgetError(error);
                    return;
                  }
                  setBudgetError(null);
                  onChange(withMinutes(value, parsed));
                }}
                keyboardType="number-pad"
                editable={!disabled}
                className="bg-surface-sunken rounded-xl px-4 py-3 text-[18px] font-semibold"
                style={{ color: colors.ink }}
              />
              {budgetError ? (
                <Typography variant="caption" tone="danger">
                  {budgetError}
                </Typography>
              ) : null}
              <Typography variant="caption" tone="muted">
                Focus Blocks can warn when {BUDGET_WARNING_MINUTES} minutes
                remain for budgets above {BUDGET_WARNING_MINUTES} minutes.
              </Typography>
            </View>
          )}
        </View>
      </Card>
    </Section>
  );
}
