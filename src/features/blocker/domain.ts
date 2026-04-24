function parseDomainCandidate(input: string) {
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
    if (url.hostname.includes('..')) {
      return null;
    }
    if (!url.hostname.includes('.')) {
      return null;
    }
    return url.hostname;
  } catch {
    return null;
  }
}

export function parseBlockedDomain(input: string) {
  return parseDomainCandidate(input);
}
