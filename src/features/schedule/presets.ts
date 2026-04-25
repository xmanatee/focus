import type { SelectionSlotId } from '../blocker/types';
import type { DayOfWeek } from './types';

export type PresetKind = 'work' | 'evening' | 'weekend';

interface PresetData {
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly days: DayOfWeek[];
  readonly notifyOnStart: boolean;
  readonly notifyOnEnd: boolean;
  readonly webDomains: string[];
}

export const PRESETS: Record<PresetKind, PresetData> = {
  work: {
    name: 'Deep Work',
    startTime: '09:00',
    endTime: '12:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    notifyOnStart: true,
    notifyOnEnd: true,
    webDomains: [
      'instagram.com',
      'facebook.com',
      'twitter.com',
      'x.com',
      'tiktok.com',
      'youtube.com',
      'reddit.com',
      'twitch.tv',
      'netflix.com',
      'hulu.com',
    ],
  },
  evening: {
    name: 'Evening Wind-down',
    startTime: '21:00',
    endTime: '23:30',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    notifyOnStart: true,
    notifyOnEnd: false,
    webDomains: [
      'youtube.com',
      'netflix.com',
      'tiktok.com',
      'twitch.tv',
      'hulu.com',
      'disneyplus.com',
      'primevideo.com',
      'instagram.com',
    ],
  },
  weekend: {
    name: 'Digital Detox',
    startTime: '08:00',
    endTime: '20:00',
    days: ['sat', 'sun'],
    notifyOnStart: true,
    notifyOnEnd: true,
    webDomains: [
      'instagram.com',
      'tiktok.com',
      'facebook.com',
      'reddit.com',
      'twitter.com',
      'x.com',
      'youtube.com',
      'twitch.tv',
    ],
  },
};

export function selectionIdForTemplate(kind: PresetKind): SelectionSlotId {
  return `template.${kind}` as SelectionSlotId;
}
