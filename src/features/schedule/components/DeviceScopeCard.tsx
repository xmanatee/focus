import { Pressable, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Section } from '../../../shared/components/Section';
import { Typography } from '../../../shared/components/Typography';
import type { ScopeChoice } from '../useFocusBlockForm';

interface DeviceScopeCardProps {
  readonly value: ScopeChoice;
  readonly onChange: (next: ScopeChoice) => void;
  readonly disabled?: boolean;
}

const CHOICES: readonly {
  readonly value: ScopeChoice;
  readonly title: string;
  readonly subtitle: string;
}[] = [
  {
    value: 'allDevices',
    title: 'All devices',
    subtitle: 'Apply this rule on every device after local app selection.',
  },
  {
    value: 'thisDevice',
    title: 'This device',
    subtitle: 'Keep this rule tied to this iPhone or iPad.',
  },
];

export function DeviceScopeCard({
  value,
  onChange,
  disabled = false,
}: DeviceScopeCardProps): JSX.Element {
  return (
    <Section title="Devices">
      <Card>
        <View className="gap-3">
          {CHOICES.map((choice) => (
            <Pressable
              key={choice.value}
              onPress={disabled ? undefined : () => onChange(choice.value)}
              className="flex-row items-center gap-3"
            >
              <Icon
                name={
                  value === choice.value ? 'checkmark.circle.fill' : 'circle'
                }
                size={20}
                tone={value === choice.value ? 'signal' : 'faint'}
              />
              <View className="flex-1 gap-1">
                <Typography variant="body-md" tone="ink">
                  {choice.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {choice.subtitle}
                </Typography>
              </View>
            </Pressable>
          ))}
        </View>
      </Card>
    </Section>
  );
}
