import { deviceStorage } from '../../shared/storage';

const RUNTIME_PLAN_CACHE_KEY = 'focusblocks.runtime-plans.v1';

type RuntimePlanSignatures = Readonly<Record<string, string>>;

export async function loadRuntimePlanSignatures(): Promise<RuntimePlanSignatures> {
  const stored = await deviceStorage.getItem(RUNTIME_PLAN_CACHE_KEY);
  if (stored === null) return {};

  const parsed: unknown = JSON.parse(stored);
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed) ||
    Object.values(parsed).some((value) => typeof value !== 'string')
  ) {
    throw new Error('Stored runtime plan signatures are invalid.');
  }
  return parsed as Record<string, string>;
}

export async function saveRuntimePlanSignatures(
  signatures: RuntimePlanSignatures,
): Promise<void> {
  await deviceStorage.setItem(
    RUNTIME_PLAN_CACHE_KEY,
    JSON.stringify(signatures),
  );
}
