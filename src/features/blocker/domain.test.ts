import { describe, expect, it } from 'vitest';
import { parseBlockedDomain } from './domain';

describe('parseBlockedDomain', () => {
  it.each([
    ['example.com', 'example.com'],
    ['Example.com', 'example.com'],
    ['  news.example.com  ', 'news.example.com'],
    ['sub.domain.example.co.uk', 'sub.domain.example.co.uk'],
  ])('accepts bare hostname %s', (input, expected) => {
    expect(parseBlockedDomain(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    'example',
    'https://example.com',
    'example.com/path',
    'example.com?q=1',
    'example..com',
    '.example.com',
    'exa mple.com',
  ])('rejects invalid input %s', (input) => {
    expect(parseBlockedDomain(input)).toBeNull();
  });
});
