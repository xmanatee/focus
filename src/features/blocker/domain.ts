export function parseBlockedDomain(input: string): string | null {
  const normalized = input.trim().toLowerCase();
  if (normalized.length === 0) {
    return null;
  }

  try {
    const url = new URL(`https://${normalized}`);
    if (url.protocol !== 'https:') return null;
    if (url.hostname !== normalized) return null;
    const labels = url.hostname.split('.');
    if (labels.length < 2) return null;
    if (
      normalized.length > 253 ||
      labels.some(
        (label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
      )
    )
      return null;
    return url.hostname;
  } catch {
    return null;
  }
}
