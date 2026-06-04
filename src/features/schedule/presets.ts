import type { SelectionSlotId } from '../blocker/types';
import type { DayOfWeek, FocusBlockRule } from './types';

export type PresetKind =
  | 'work'
  | 'study'
  | 'socialBudget'
  | 'youtube'
  | 'evening'
  | 'weekend';

interface PresetData {
  readonly name: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly days: DayOfWeek[];
  readonly rule: FocusBlockRule;
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
    rule: { kind: 'blockDuringSchedule' },
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
  study: {
    name: 'Study Focus',
    startTime: '16:00',
    endTime: '18:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    rule: { kind: 'blockDuringSchedule' },
    notifyOnStart: true,
    notifyOnEnd: true,
    webDomains: [
      'instagram.com',
      'tiktok.com',
      'youtube.com',
      'reddit.com',
      'snapchat.com',
      'discord.com',
      'twitch.tv',
    ],
  },
  socialBudget: {
    name: 'Social Budget',
    startTime: '09:00',
    endTime: '22:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    rule: { kind: 'dailyBudget', minutes: 15 },
    notifyOnStart: false,
    notifyOnEnd: false,
    webDomains: [
      'instagram.com',
      'tiktok.com',
      'facebook.com',
      'reddit.com',
      'twitter.com',
      'x.com',
      'snapchat.com',
    ],
  },
  youtube: {
    name: 'YouTube Limit',
    startTime: '09:00',
    endTime: '22:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    rule: { kind: 'dailyBudget', minutes: 10 },
    notifyOnStart: false,
    notifyOnEnd: false,
    webDomains: ['youtube.com', 'm.youtube.com', 'youtu.be'],
  },
  evening: {
    name: 'Evening Wind-down',
    startTime: '21:00',
    endTime: '23:30',
    days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    rule: { kind: 'blockDuringSchedule' },
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
    rule: { kind: 'blockDuringSchedule' },
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
