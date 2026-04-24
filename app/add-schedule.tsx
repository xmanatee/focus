import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import type {
  CreateScheduleInput,
  DayOfWeek,
} from '../src/features/schedule/types';
import { useScheduleStore } from '../src/features/schedule/useScheduleStore';
import { validateScheduleInput } from '../src/features/schedule/validation';
import { Button } from '../src/shared/components/Button';
import { Typography } from '../src/shared/components/Typography';
import { useBlockerStore } from '../src/store/useBlockerStore';

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'M', value: 'mon' },
  { label: 'T', value: 'tue' },
  { label: 'W', value: 'wed' },
  { label: 'T', value: 'thu' },
  { label: 'F', value: 'fri' },
  { label: 'S', value: 'sat' },
  { label: 'S', value: 'sun' },
];

const DAY_ORDER: Record<DayOfWeek, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

export default function AddScheduleScreen() {
  const router = useRouter();
  const addSchedule = useScheduleStore((state) => state.addSchedule);
  const selection = useBlockerStore((state) => state.selection);

  const [name, setName] = useState('My Focus Session');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((currentDays) => {
      if (currentDays.includes(day)) {
        return currentDays.filter((currentDay) => currentDay !== day);
      }
      return [...currentDays, day].sort(
        (left, right) => DAY_ORDER[left] - DAY_ORDER[right],
      );
    });
  };

  const handleSave = async () => {
    const input: CreateScheduleInput = {
      name,
      startTime,
      endTime,
      days: selectedDays,
      isEnabled: true,
      selection,
    };

    setErrorMessage(null);
    setIsSaving(true);
    try {
      validateScheduleInput(input);
      await addSchedule({
        ...input,
        name: input.name.trim(),
      });
      router.back();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not create schedule.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background p-6">
      <Typography variant="h2" className="mb-6">
        New Schedule
      </Typography>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Typography
            variant="caption"
            className="mb-2 uppercase font-bold tracking-wider"
          >
            Name
          </Typography>
          <TextInput
            className="bg-surface p-4 rounded-xl border border-gray-200 text-lg"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Work Focus"
          />
        </View>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1">
            <Typography
              variant="caption"
              className="mb-2 uppercase font-bold tracking-wider"
            >
              Start Time
            </Typography>
            <TextInput
              className="bg-surface p-4 rounded-xl border border-gray-200 text-lg"
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View className="flex-1">
            <Typography
              variant="caption"
              className="mb-2 uppercase font-bold tracking-wider"
            >
              End Time
            </Typography>
            <TextInput
              className="bg-surface p-4 rounded-xl border border-gray-200 text-lg"
              value={endTime}
              onChangeText={setEndTime}
              placeholder="17:00"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numbers-and-punctuation"
            />
          </View>
        </View>

        <View className="mb-8">
          <Typography
            variant="caption"
            className="mb-3 uppercase font-bold tracking-wider"
          >
            Repeat Days
          </Typography>
          <View className="flex-row justify-between">
            {DAYS.map((day) => (
              <Pressable
                key={day.value}
                onPress={() => toggleDay(day.value)}
                className={`w-10 h-10 rounded-full items-center justify-center ${
                  selectedDays.includes(day.value)
                    ? 'bg-primary'
                    : 'bg-gray-200'
                }`}
              >
                <Typography
                  className={
                    selectedDays.includes(day.value)
                      ? 'text-white font-bold'
                      : 'text-text'
                  }
                >
                  {day.label}
                </Typography>
              </Pressable>
            ))}
          </View>
        </View>

        {errorMessage ? (
          <Typography variant="caption" className="mb-4 text-red-600">
            {errorMessage}
          </Typography>
        ) : null}

        <View className="gap-4">
          <Button
            title="Create Schedule"
            onPress={() => void handleSave()}
            isLoading={isSaving}
            disabled={isSaving}
          />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            disabled={isSaving}
          />
        </View>
      </ScrollView>
    </View>
  );
}
