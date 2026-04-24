import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { api } from '../../convex/_generated/api';
import { useBlockerStore } from '../../src/features/blocker/useBlockerStore';
import { useActiveSchedule } from '../../src/features/schedule/useActiveSchedule';
import type { Schedule } from '../../src/features/schedule/useScheduleStore';
import { useAdminState } from '../../src/features/settings/useAdminState';
import { Button } from '../../src/shared/components/Button';
import { Icon } from '../../src/shared/components/Icon';
import { Screen } from '../../src/shared/components/Screen';
import { Typography } from '../../src/shared/components/Typography';
import { haptic } from '../../src/shared/design/haptics';
import { useAsyncAction } from '../../src/shared/hooks/useAsyncAction';

function formatDayShort(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatRelative(at: Date, now: Date): string {
  const deltaMin = Math.round((at.getTime() - now.getTime()) / 60_000);
  if (deltaMin < 60) {
    return `in ${Math.max(1, deltaMin)} min`;
  }
  const hours = Math.round(deltaMin / 60);
  if (hours < 24) {
    return `in ${hours} hr`;
  }
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

export default function DashboardScreen(): JSX.Element {
  const router = useRouter();

  const hasPermissions = useBlockerStore((s) => s.hasPermissions);
  const busyState = useBlockerStore((s) => s.busyState);
  const requestPermissions = useBlockerStore((s) => s.requestPermissions);

  const schedules = useQuery(api.schedules.get);
  const { active, next, now } = useActiveSchedule(schedules);
  const { state: adminState } = useAdminState();

  const { error, run } = useAsyncAction();

  const handleGrant = (): Promise<boolean> =>
    run(async () => {
      void haptic.commit();
      const granted = await requestPermissions();
      if (!granted) {
        throw new Error('Screen Time permission was not granted.');
      }
    }, 'Could not request Screen Time permission.');

  const openSettings = (): void => {
    void haptic.select();
    router.push('/settings');
  };

  if (!hasPermissions) {
    return (
      <Screen>
        <TopBar onOpenSettings={openSettings} />
        <View className="flex-1 justify-center gap-5">
          <Typography variant="label" tone="signal">
            Before you begin
          </Typography>
          <Typography variant="display-md" tone="ink">
            Grant Screen Time access.
          </Typography>
          <Typography variant="body" tone="muted" className="max-w-[340px]">
            Fucus blocks apps and sites on your device using Apple&apos;s Family
            Controls. Nothing leaves your phone.
          </Typography>
          <View className="mt-4">
            <Button
              title="Grant access"
              variant="commit"
              onPress={() => void handleGrant()}
              isLoading={busyState === 'authorizing'}
              disabled={busyState !== 'idle'}
            />
          </View>
          {error ? (
            <Typography variant="caption" tone="danger" align="center">
              {error}
            </Typography>
          ) : null}
        </View>
      </Screen>
    );
  }

  if (schedules === undefined) {
    return (
      <Screen>
        <TopBar onOpenSettings={openSettings} />
        <View className="flex-1 items-center justify-center">
          <Typography variant="body" tone="muted">
            Loading...
          </Typography>
        </View>
      </Screen>
    );
  }

  if (schedules.length === 0) {
    return (
      <Screen>
        <TopBar onOpenSettings={openSettings} />
        <View className="flex-1 justify-center gap-5">
          <Typography variant="label" tone="muted">
            Empty calendar
          </Typography>
          <Typography variant="display-md" tone="ink">
            Create your first window.
          </Typography>
          <Typography variant="body" tone="muted" className="max-w-[340px]">
            Schedules decide what Fucus blocks and when. Add a window for
            weekday deep work, an evening cut-off, or Sunday rest.
          </Typography>
          <View className="mt-4">
            <Button
              title="Add schedule"
              variant="commit"
              onPress={() => router.push('/add-schedule')}
              disabled={adminState.kind === 'locked'}
            />
          </View>
          {adminState.kind === 'locked' ? (
            <Typography variant="caption" tone="faint" className="mt-1">
              Setup hours are locked. Open Settings to check when the next
              unlock window opens.
            </Typography>
          ) : null}
        </View>
      </Screen>
    );
  }

  if (active) {
    return (
      <ActiveView schedule={active} now={now} onOpenSettings={openSettings} />
    );
  }

  return (
    <Screen>
      <TopBar onOpenSettings={openSettings} />
      <View className="flex-1 justify-center gap-5">
        <Typography variant="label" tone="muted">
          Idle
        </Typography>
        <Typography variant="display-md" tone="ink">
          {next ? next.schedule.name : 'No upcoming schedule.'}
        </Typography>
        {next ? (
          <Typography variant="body" tone="muted">
            Starts {formatRelative(next.at, now)} · {next.schedule.startTime}–
            {next.schedule.endTime}
          </Typography>
        ) : (
          <Typography variant="body" tone="muted">
            All your schedules are off. Turn one on from the Schedules tab.
          </Typography>
        )}
      </View>
    </Screen>
  );
}

function ActiveView({
  schedule,
  now,
  onOpenSettings,
}: {
  schedule: Schedule;
  now: Date;
  onOpenSettings: () => void;
}): JSX.Element {
  const endParts = schedule.endTime.split(':').map(Number);
  const endOfWindow = new Date(now);
  endOfWindow.setHours(endParts[0], endParts[1], 0, 0);
  if (endOfWindow <= now) {
    endOfWindow.setDate(endOfWindow.getDate() + 1);
  }

  return (
    <Screen tone="sunken">
      <TopBar onOpenSettings={onOpenSettings} />
      <View className="flex-1 items-center justify-center gap-4 py-10">
        <Typography variant="label" tone="signal">
          In session
        </Typography>
        <Typography variant="display-lg" tone="ink" align="center">
          {schedule.name}
        </Typography>
        <Typography variant="body" tone="muted" align="center">
          Ends at {schedule.endTime} · {formatRelative(endOfWindow, now)}
        </Typography>
        <View className="mt-6 flex-row flex-wrap gap-2 justify-center max-w-[300px]">
          {schedule.days.map((day) => (
            <Typography key={day} variant="caption" tone="faint">
              {formatDayShort(day)}
            </Typography>
          ))}
        </View>
        <Typography
          variant="caption"
          tone="faint"
          align="center"
          className="mt-8 max-w-[280px]"
        >
          While active, this schedule cannot be changed or cancelled.
        </Typography>
      </View>
    </Screen>
  );
}

function TopBar({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}): JSX.Element {
  return (
    <View className="flex-row justify-between items-center py-3">
      <Typography variant="label" tone="signal">
        Fucus
      </Typography>
      <Pressable
        onPress={onOpenSettings}
        className="h-11 w-11 items-center justify-center rounded-full bg-surface-raised"
        accessibilityLabel="Settings"
      >
        <Icon name="gearshape" size={20} tone="muted" />
      </Pressable>
    </View>
  );
}
