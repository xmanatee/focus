import type { ReactTestInstance } from 'react-test-renderer';

export function collectText(node: ReactTestInstance): string[] {
  const text: string[] = [];

  const visit = (value: ReactTestInstance): void => {
    for (const child of value.children) {
      if (typeof child === 'string') {
        text.push(child);
        continue;
      }
      visit(child);
    }
  };

  visit(node);
  return text;
}
