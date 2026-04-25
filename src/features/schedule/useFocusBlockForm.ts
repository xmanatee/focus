import { useMemo, useState } from 'react';
import {
  DAY_ORDER,
  dateToTimeString,
  timeStringToDate,
} from '../../shared/days';
import { PRESETS, type PresetKind } from './presets';
import type { DayOfWeek, FocusBlock } from './types';

interface FocusBlockFormState {
  readonly name: string;
  readonly setName: (next: string) => void;
  readonly startDate: Date;
  readonly setStartDate: (next: Date) => void;
  readonly endDate: Date;
  readonly setEndDate: (next: Date) => void;
  readonly selectedDays: readonly DayOfWeek[];
  readonly toggleDay: (day: DayOfWeek) => void;
  readonly notifyOnStart: boolean;
  readonly setNotifyOnStart: (next: boolean) => void;
  readonly notifyOnEnd: boolean;
  readonly setNotifyOnEnd: (next: boolean) => void;
  readonly webDomains: readonly string[];
  readonly setWebDomains: (next: readonly string[]) => void;
  readonly strict: boolean;
  readonly setStrict: (next: boolean) => void;
  readonly startTime: string;
  readonly endTime: string;
  readonly applyPreset: (kind: PresetKind) => void;
}

export function useFocusBlockForm(
  existing: FocusBlock | null,
): FocusBlockFormState {
  const [name, setName] = useState<string>(existing?.name ?? 'Focus block');
  const [startDate, setStartDate] = useState<Date>(() =>
    timeStringToDate(existing?.startTime ?? '09:00'),
  );
  const [endDate, setEndDate] = useState<Date>(() =>
    timeStringToDate(existing?.endTime ?? '17:00'),
  );
  const [selectedDays, setSelectedDays] = useState<readonly DayOfWeek[]>(
    existing ? existing.days : ['mon', 'tue', 'wed', 'thu', 'fri'],
  );
  const [notifyOnStart, setNotifyOnStart] = useState(
    existing?.notifyOnStart ?? true,
  );
  const [notifyOnEnd, setNotifyOnEnd] = useState(
    existing?.notifyOnEnd ?? false,
  );
  const [webDomains, setWebDomains] = useState<readonly string[]>(
    existing?.selection.webDomains ?? [],
  );
  const [strict, setStrict] = useState<boolean>(existing?.strict ?? false);

  const startTime = useMemo(() => dateToTimeString(startDate), [startDate]);
  const endTime = useMemo(() => dateToTimeString(endDate), [endDate]);

  const toggleDay = (day: DayOfWeek): void => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((d) => d !== day)
        : [...current, day].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b]),
    );
  };

  const applyPreset = (kind: PresetKind): void => {
    const preset = PRESETS[kind];
    setName(preset.name);
    setStartDate(timeStringToDate(preset.startTime));
    setEndDate(timeStringToDate(preset.endTime));
    setSelectedDays(preset.days);
    setNotifyOnStart(preset.notifyOnStart);
    setNotifyOnEnd(preset.notifyOnEnd);
    setWebDomains(preset.webDomains);
  };

  return {
    name,
    setName,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedDays,
    toggleDay,
    notifyOnStart,
    setNotifyOnStart,
    notifyOnEnd,
    setNotifyOnEnd,
    webDomains,
    setWebDomains,
    strict,
    setStrict,
    startTime,
    endTime,
    applyPreset,
  };
}
