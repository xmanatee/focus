import type {
  RuntimeAccessKind,
  RuntimeAccessState,
} from '../../bridge/BlockerBridge.types';
import type { FocusBlock, FocusBlockInput } from './types';

type RuntimeAccessInput = Pick<
  FocusBlock | FocusBlockInput,
  'rule' | 'selection'
>;

export function runtimeAccessRequirements(
  block: RuntimeAccessInput,
): readonly RuntimeAccessKind[] {
  const requirements: RuntimeAccessKind[] = [];
  if (
    block.rule.kind === 'dailyBudget' ||
    block.rule.kind === 'allowDuringScheduleWithBudget'
  ) {
    requirements.push('dailyBudgets');
  }
  if (block.selection.webDomains.length > 0) {
    requirements.push('websiteBlocking');
  }
  return requirements;
}

export function missingRuntimeAccess(
  block: RuntimeAccessInput,
  access: RuntimeAccessState,
): readonly RuntimeAccessKind[] {
  return runtimeAccessRequirements(block).filter(
    (requirement) => access[requirement] !== 'authorized',
  );
}
