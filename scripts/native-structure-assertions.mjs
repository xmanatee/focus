import fs from 'node:fs';

export const read = (path) => fs.readFileSync(path, 'utf8');

export function expectIncludes(content, value, label) {
  if (!content.includes(value)) {
    throw new Error(`${label} is missing "${value}".`);
  }
}

export function expectExcludes(content, value, label) {
  if (content.includes(value)) {
    throw new Error(`${label} must not contain "${value}".`);
  }
}

export function expectMatch(content, pattern, label) {
  const match = content.match(pattern);
  if (!match) {
    throw new Error(`${label} is missing.`);
  }
  return match[1];
}

export function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label} is "${actual}", expected "${expected}".`);
  }
}
