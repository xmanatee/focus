import { Pressable, TextInput, View } from 'react-native';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Section } from '../../../shared/components/Section';
import { Typography } from '../../../shared/components/Typography';
import { useThemeColors } from '../../../shared/design/theme';
import {
  type PersistedActivitySelection,
  summarizeActivitySelection,
} from '../types';

interface BlockingCardProps {
  readonly activitySelection: PersistedActivitySelection;
  readonly onOpenAppsPicker: () => void;
  readonly webDomains: readonly string[];
  readonly newDomain: string;
  readonly onNewDomainChange: (next: string) => void;
  readonly onAddDomain: () => void;
  readonly onRemoveDomain: (domain: string) => void;
  readonly disabled?: boolean;
}

export function BlockingCard({
  activitySelection,
  onOpenAppsPicker,
  webDomains,
  newDomain,
  onNewDomainChange,
  onAddDomain,
  onRemoveDomain,
  disabled = false,
}: BlockingCardProps): JSX.Element {
  const colors = useThemeColors();

  return (
    <Section title="Blocking">
      <Card onPress={disabled ? undefined : onOpenAppsPicker}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            <Icon name="app.badge" size={24} tone="muted" />
            <View>
              <Typography variant="body-md" tone="ink">
                Apps & Categories
              </Typography>
              <Typography variant="caption" tone="muted">
                {(() => {
                  const summary = summarizeActivitySelection(activitySelection);
                  return summary === 'None' ? 'None selected' : `${summary} selected`;
                })()}
              </Typography>
            </View>
          </View>
          {!disabled && <Icon name="chevron.right" size={18} tone="faint" />}
        </View>
      </Card>

      <Card>
        <View className="flex-row items-center gap-4">
          <Icon name="globe" size={24} tone="muted" />
          <Typography variant="body-md" tone="ink" className="flex-1">
            Blocked Websites
          </Typography>
        </View>

        {!disabled && (
          <View className="flex-row gap-2">
            <TextInput
              placeholder="example.com"
              placeholderTextColor={colors.inkFaint}
              value={newDomain}
              onChangeText={onNewDomainChange}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              className="flex-1 bg-surface-sunken rounded-xl px-4 py-3"
              style={{ color: colors.ink }}
            />
            <Pressable
              onPress={onAddDomain}
              className="bg-signal w-12 h-12 items-center justify-center rounded-xl"
            >
              <Icon name="plus" size={20} tone="surface" />
            </Pressable>
          </View>
        )}

        {webDomains.length > 0 && (
          <View className="gap-2">
            {webDomains.map((domain) => (
              <View
                key={domain}
                className="flex-row justify-between items-center bg-surface-sunken/40 px-4 py-3 rounded-xl border border-divider/5"
              >
                <Typography variant="body" tone="ink">
                  {domain}
                </Typography>
                {!disabled && (
                  <Pressable onPress={() => onRemoveDomain(domain)}>
                    <Icon name="xmark.circle.fill" size={18} tone="faint" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </Card>
    </Section>
  );
}
