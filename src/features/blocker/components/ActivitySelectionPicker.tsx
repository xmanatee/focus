import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  type ListRenderItem,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import {
  BlockerBridge,
  type SelectableApplication,
  parseSelectedApplications,
  serializeSelectedApplications,
} from '../../../bridge/BlockerBridge';
import { Button } from '../../../shared/components/Button';
import { Card } from '../../../shared/components/Card';
import { Icon } from '../../../shared/components/Icon';
import { Typography } from '../../../shared/components/Typography';
import { useThemeColors } from '../../../shared/design/theme';
import { errorMessage } from '../../../shared/errors';
import type { ActivitySelectionMetadata, SelectionSlotId } from '../types';

interface ActivitySelectionPickerProps {
  readonly familyActivitySelectionId: SelectionSlotId;
  readonly includeEntireCategory: boolean;
  readonly onDismissRequest: () => void;
  readonly onSelectionChange: (metadata: ActivitySelectionMetadata) => void;
}

type ApplicationLoadState =
  | { readonly kind: 'loading' }
  | {
      readonly kind: 'ready';
      readonly applications: readonly SelectableApplication[];
    }
  | { readonly kind: 'error'; readonly message: string };

export function ActivitySelectionPicker({
  familyActivitySelectionId,
  onDismissRequest,
  onSelectionChange,
}: ActivitySelectionPickerProps): React.JSX.Element {
  const colors = useThemeColors();
  const [storedApplications] = useState<readonly SelectableApplication[]>(() =>
    parseSelectedApplications(
      BlockerBridge.getSelectionSlotValue(familyActivitySelectionId),
    ),
  );
  const [loadState, setLoadState] = useState<ApplicationLoadState>({
    kind: 'loading',
  });
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(storedApplications.map((app) => app.id)),
  );

  useEffect(() => {
    if (loadState.kind !== 'loading') return;
    let isCurrent = true;
    void BlockerBridge.listSelectableApplications().then(
      (items) => {
        if (!isCurrent) return;
        setLoadState({ kind: 'ready', applications: items });
      },
      (caught) => {
        if (!isCurrent) return;
        setLoadState({
          kind: 'error',
          message: errorMessage(caught),
        });
      },
    );
    return () => {
      isCurrent = false;
    };
  }, [loadState.kind]);

  const knownApplications = useMemo(() => {
    const byId = new Map(
      storedApplications.map((app) => [app.id, app] as const),
    );
    if (loadState.kind === 'ready') {
      for (const app of loadState.applications) byId.set(app.id, app);
    }
    return [...byId.values()];
  }, [loadState, storedApplications]);

  const visibleApplications =
    loadState.kind === 'ready' ? knownApplications : [];
  const availableApplicationIds = useMemo(
    () =>
      new Set(
        loadState.kind === 'ready'
          ? loadState.applications.map((app) => app.id)
          : [],
      ),
    [loadState],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (normalized.length === 0) return visibleApplications;
    return visibleApplications.filter(
      (app) =>
        app.name.toLocaleLowerCase().includes(normalized) ||
        app.id.toLocaleLowerCase().includes(normalized),
    );
  }, [query, visibleApplications]);

  const selectedApplications = useMemo(
    () => knownApplications.filter((app) => selectedIds.has(app.id)),
    [knownApplications, selectedIds],
  );

  const toggleApp = (app: SelectableApplication): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(app.id)) next.delete(app.id);
      else next.add(app.id);
      return next;
    });
  };

  const commit = (): void => {
    const slotValue =
      selectedApplications.length === 0
        ? undefined
        : serializeSelectedApplications(selectedApplications);
    BlockerBridge.setSelectionSlotValue(familyActivitySelectionId, slotValue);
    onSelectionChange({
      applicationCount: selectedApplications.length,
      categoryCount: 0,
      includeEntireCategory: false,
      webDomainCount: 0,
    });
    onDismissRequest();
  };

  const renderItem: ListRenderItem<SelectableApplication> = ({ item }) => {
    const isSelected = selectedIds.has(item.id);
    const isAvailable = availableApplicationIds.has(item.id);
    return (
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        onPress={() => toggleApp(item)}
        className="flex-row items-center gap-3 py-3"
      >
        <Icon
          name={isSelected ? 'checkmark.circle.fill' : 'circle'}
          size={22}
          tone={isSelected ? 'signal' : 'faint'}
        />
        <View className="flex-1 gap-0.5">
          <Typography variant="body-md" tone="ink">
            {item.name}
          </Typography>
          <Typography variant="caption" tone="muted">
            {isAvailable ? item.id : `${item.id} · Not currently installed`}
          </Typography>
        </View>
      </Pressable>
    );
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" visible>
      <View
        className="flex-1 px-4 pt-6 pb-8 gap-4"
        style={{ backgroundColor: colors.surface }}
      >
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Typography variant="display-md" tone="ink">
              Pick apps.
            </Typography>
            <Typography variant="body" tone="muted">
              {selectedApplications.length} selected
            </Typography>
          </View>
          <Pressable
            accessibilityLabel="Close app picker"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center"
            onPress={onDismissRequest}
          >
            <Icon name="xmark.circle.fill" size={28} tone="faint" />
          </Pressable>
        </View>

        <TextInput
          accessibilityLabel="Search installed apps"
          autoCapitalize="none"
          autoCorrect={false}
          className="bg-surface-sunken rounded-xl px-4 py-3 text-[17px]"
          onChangeText={setQuery}
          placeholder="Search apps"
          placeholderTextColor={colors.inkFaint}
          style={{ color: colors.ink }}
          value={query}
        />

        <Card className="flex-1">
          <FlatList
            data={filtered}
            extraData={selectedIds}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={renderItem}
            ListEmptyComponent={
              <Typography
                variant="body"
                tone={loadState.kind === 'error' ? 'signal' : 'muted'}
              >
                {loadState.kind === 'loading'
                  ? 'Loading installed apps...'
                  : loadState.kind === 'error'
                    ? loadState.message
                    : 'No installed apps found.'}
              </Typography>
            }
          />
        </Card>

        {loadState.kind === 'error' ? (
          <Button
            title="Try again"
            variant="ghost"
            onPress={() => setLoadState({ kind: 'loading' })}
          />
        ) : null}
        <Button
          title="Save apps"
          variant="commit"
          disabled={loadState.kind !== 'ready'}
          onPress={commit}
        />
      </View>
    </Modal>
  );
}
