import { selectionIdForBlock } from '../features/blocker/types';
import type { RuntimeFocusBlock } from '../features/schedule/types';
import { parseSelectedApplications } from './BlockerBridge.shared';

type ReadSelectionSlot = (slotId: string) => string | undefined;

function serializedRule(block: RuntimeFocusBlock): RuntimeFocusBlock['rule'] {
  return block.rule.kind === 'dailyBudget' ||
    block.rule.kind === 'allowDuringScheduleWithBudget'
    ? { kind: block.rule.kind, minutes: block.rule.minutes }
    : { kind: block.rule.kind };
}

export function serializeAndroidRuntimePlan(
  blocks: readonly RuntimeFocusBlock[],
  readSelectionSlot: ReadSelectionSlot,
): string {
  return JSON.stringify({
    version: 1,
    blocks: blocks
      .filter((block) => block.isEnabled)
      .map((block) => ({
        days: block.days,
        endTime: block.endTime,
        id: block.id,
        name: block.name,
        rule: serializedRule(block),
        selectedPackageIds: parseSelectedApplications(
          readSelectionSlot(selectionIdForBlock(block.id)),
        )
          .map((app) => app.id)
          .sort(),
        startTime: block.startTime,
        webDomains: [...block.selection.webDomains].sort(),
      })),
  });
}
