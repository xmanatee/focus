import { BlockerBridge } from '../../bridge/BlockerBridge';
import { hasSavedActivitySelection } from '../blocker/types';
import type { FocusBlock, FocusBlockInput } from './types';

type RuntimeSupportInput = Pick<
  FocusBlock | FocusBlockInput,
  'rule' | 'selection'
>;

export function focusBlockUnsupportedReason(
  block: RuntimeSupportInput,
): string | null {
  const capabilities = BlockerBridge.capabilities;
  if (
    !capabilities.supportsDailyBudgets &&
    (block.rule.kind === 'dailyBudget' ||
      block.rule.kind === 'allowDuringScheduleWithBudget')
  ) {
    return `Daily budgets are not available with ${capabilities.authorizationAccessName}.`;
  }
  if (
    !capabilities.supportsWebsiteBlocking &&
    block.selection.webDomains.length > 0
  ) {
    return `Website blocking is not available with ${capabilities.authorizationAccessName}.`;
  }
  const activitySelection = block.selection.activitySelection;
  if (
    !capabilities.supportsAppCategories &&
    hasSavedActivitySelection(activitySelection) &&
    activitySelection.categoryCount > 0
  ) {
    return `App category blocking is not available with ${capabilities.authorizationAccessName}.`;
  }
  return null;
}
