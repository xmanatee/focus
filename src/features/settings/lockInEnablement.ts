import { focusBlocksRunnableLocally } from '../schedule/localRuntime';
import type { FocusBlock } from '../schedule/types';

type LockInEnablement =
  | { readonly kind: 'allowed' }
  | { readonly kind: 'blocked'; readonly message: string };

export function resolveLockInEnablement(
  focusBlocks: readonly FocusBlock[],
  enabledBlockIds: readonly string[],
): LockInEnablement {
  const runnable = focusBlocksRunnableLocally(focusBlocks, enabledBlockIds);
  if (runnable.some((block) => block.isEnabled)) {
    return { kind: 'allowed' };
  }

  return {
    kind: 'blocked',
    message:
      'Turn on at least one ready focus block on this device before enabling Lock-in.',
  };
}
