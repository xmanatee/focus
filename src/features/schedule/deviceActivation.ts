import type { FocusBlock } from './types';

export function normalizeEnabledDeviceIds(
  deviceIds: readonly string[],
): readonly string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const deviceId of deviceIds) {
    const trimmed = deviceId.trim();
    if (trimmed.length === 0 || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

export function focusBlockIsEnabledOnDevice(
  block: Pick<FocusBlock, 'enabledDeviceIds' | 'isEnabled'>,
  deviceId: string | null,
): boolean {
  return (
    block.isEnabled &&
    deviceId !== null &&
    block.enabledDeviceIds.includes(deviceId)
  );
}

export function focusBlockWithDeviceEnabledState<T extends FocusBlock>(
  block: T,
  deviceId: string | null,
): T {
  const isEnabled = focusBlockIsEnabledOnDevice(block, deviceId);
  return block.isEnabled === isEnabled ? block : { ...block, isEnabled };
}

export function enabledDeviceIdsAfterToggle(
  current: readonly string[],
  deviceId: string,
  isEnabled: boolean,
): readonly string[] {
  const normalized = normalizeEnabledDeviceIds(current);
  if (isEnabled) {
    return normalized.includes(deviceId)
      ? normalized
      : [...normalized, deviceId];
  }
  return normalized.filter((id) => id !== deviceId);
}
