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
    if (labels.some((label) => label.length === 0)) return null;
    return url.hostname;
  } catch {
    return null;
  }
}
