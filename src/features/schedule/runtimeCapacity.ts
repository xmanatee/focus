import { BlockerBridge } from '../../bridge/BlockerBridge';
import { minutesOf } from '../../shared/days';
import type { SetupBlock } from '../settings/adminState';
import { budgetOriginDaysAtWeeklyInstant } from './schedulerActions';
import { DAY_OF_WEEK_VALUES, type RuntimeFocusBlock } from './types';
import { isActiveAtWeeklyInstant } from './weeklyInstant';

function monitorCount(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
): number {
  const blockMonitors = blocks.reduce(
    (total, block) => total + (block.isEnabled ? block.days.length : 0),
    0,
  );
  const setupMonitors =
    setupBlock?.notifyOnStart === true ? setupBlock.days.length : 0;
  return blockMonitors + setupMonitors;
}

function assertWebDomainCapacity(blocks: readonly RuntimeFocusBlock[]): void {
  const limit = BlockerBridge.capabilities.maxSimultaneousWebDomains;
  if (limit === null) return;
  const enabled = blocks.filter(
    (block) => block.isEnabled && block.selection.webDomains.length > 0,
  );
  const boundaries = new Set([
    0,
    ...enabled.flatMap((block) => [
      minutesOf(block.startTime),
      minutesOf(block.endTime),
    ]),
  ]);
  for (const day of DAY_OF_WEEK_VALUES) {
    for (const minute of boundaries) {
      const domains = new Set(
        enabled.flatMap((block) =>
          isActiveAtWeeklyInstant(block, day, minute) ||
          budgetOriginDaysAtWeeklyInstant(block, day, minute).length > 0
            ? block.selection.webDomains
            : [],
        ),
      );
      if (domains.size > limit) {
        throw new Error(
          `These blocks can require ${domains.size} websites at once, but this device supports ${limit}. Reduce the websites or overlapping schedules.`,
        );
      }
    }
  }
}

export function assertRuntimeCapacity(
  blocks: readonly RuntimeFocusBlock[],
  setupBlock: SetupBlock | null,
): void {
  assertWebDomainCapacity(blocks);
  const limit = BlockerBridge.capabilities.maxScheduledMonitors;
  if (limit === null) return;

  const count = monitorCount(blocks, setupBlock);
  if (count <= limit) return;

  throw new Error(
    `This setup needs ${count} schedule monitors, but this device supports ${limit}. Turn off a block or select fewer active days.`,
  );
}
