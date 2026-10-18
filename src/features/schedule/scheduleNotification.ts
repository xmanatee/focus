import type { RuntimeFocusBlock } from './types';

export function scheduleNotification(
  block: RuntimeFocusBlock,
  boundary: 'start' | 'end',
): { readonly title: string; readonly body: string } {
  const allowsInside =
    block.rule.kind === 'allowDuringSchedule' ||
    block.rule.kind === 'allowDuringScheduleWithBudget';
  if (allowsInside) {
    return boundary === 'start'
      ? {
          title: 'App Window Open',
          body: `"${block.name}" now allows your selected apps${
            block.rule.kind === 'allowDuringScheduleWithBudget'
              ? ' within their usage limit'
              : ''
          }. Other blocks still apply.`,
        }
      : {
          title: 'App Window Closed',
          body: `"${block.name}" now blocks your selected apps outside the allowed window.`,
        };
  }
  return boundary === 'start'
    ? {
        title: 'Focus Block Started',
        body: `"${block.name}" is now active. Distractions are blocked.`,
      }
    : {
        title: 'Focus Block Ended',
        body: `"${block.name}" has finished. Other blocks still apply.`,
      };
}
