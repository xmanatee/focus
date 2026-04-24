import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
import { Button } from '../../src/shared/components/Button';
import { Typography } from '../../src/shared/components/Typography';
import { useAsyncAction } from '../../src/shared/hooks/useAsyncAction';

export default function LibraryScreen(): JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const selection = useBlockerStore((state) => state.selection);
  const addWebDomain = useBlockerStore((state) => state.addWebDomain);
  const removeWebDomain = useBlockerStore((state) => state.removeWebDomain);

  const [newDomain, setNewDomain] = useState('');
  const { error, run } = useAsyncAction();

  const handleAddDomain = async (): Promise<void> => {
    const success = await run(
      () => addWebDomain(newDomain),
      'Could not add website.',
    );
    if (success) {
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domain: string): Promise<boolean> =>
    run(() => removeWebDomain(domain), 'Could not remove website.');

  const appSelectionSummary =
    selection.activitySelection.status === 'saved'
      ? `${selection.activitySelection.applicationCount} apps, ${selection.activitySelection.categoryCount} categories, ${selection.activitySelection.webDomainCount} web selections`
      : 'No apps selected yet.';

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top }}
    >
      <View className="mt-8 mb-8">
        <Typography variant="h2">Library</Typography>
        <Typography variant="caption" className="mt-1">
          Manage your blocked apps and websites.
        </Typography>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="bg-surface p-4 rounded-2xl mb-6 border border-gray-200">
          <Typography variant="h3">Selected Apps</Typography>
          <Typography variant="body" className="mt-2 mb-4 text-textMuted">
            {appSelectionSummary}
          </Typography>

          <Button
            title="Choose Apps"
            variant="secondary"
            onPress={() => router.push('/select-apps')}
          />
        </View>

        <View className="bg-surface p-4 rounded-2xl mb-6 border border-gray-200">
          <Typography variant="h3">Blocked Websites</Typography>

          <View className="flex-row gap-2 mt-4 mb-4">
            <TextInput
              className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-100"
              placeholder="example.com"
              value={newDomain}
              onChangeText={setNewDomain}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => void handleAddDomain()}
              className="bg-primary px-4 rounded-xl items-center justify-center"
            >
              <Typography className="text-white font-bold">Add</Typography>
            </Pressable>
          </View>

          {error ? (
            <Typography variant="caption" className="mb-4 text-red-600">
              {error}
            </Typography>
          ) : null}

          {selection.webDomains.length === 0 ? (
            <Typography variant="body" className="text-textMuted">
              No websites blocked yet.
            </Typography>
          ) : (
            selection.webDomains.map((domain) => (
              <View
                key={domain}
                className="flex-row justify-between items-center py-3 border-b border-gray-50"
              >
                <Typography variant="body">{domain}</Typography>
                <Pressable onPress={() => void handleRemoveDomain(domain)}>
                  <Typography className="text-red-500 font-semibold">
                    Remove
                  </Typography>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
