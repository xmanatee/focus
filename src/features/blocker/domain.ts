function parseDomainCandidate(input: string): string | null {
  const normalizedInput = input.trim().toLowerCase();
  if (normalizedInput.length === 0) {
    return null;
  }

  try {
    const url = new URL(`https://${normalizedInput}`);
    if (url.protocol !== 'https:') {
      return null;
    }
    if (url.hostname !== normalizedInput) {
      return null;
    }
    const labels = url.hostname.split('.');
    if (labels.length < 2) {
      return null;
    }
    if (labels.some((label) => label.length === 0)) {
      return null;
    }
    return url.hostname;
  } catch {
    return null;
  }
}

export function parseBlockedDomain(input: string): string | null {
  return parseDomainCandidate(input);
}
