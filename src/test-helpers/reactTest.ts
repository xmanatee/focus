import { type ReactElement, act } from 'react';
import { type Root, type TestInstance, createRoot } from 'test-renderer';

export async function renderTestRoot(element: ReactElement): Promise<Root> {
  const root = createRoot({ textComponentTypes: ['Text'] });
  await act(async () => {
    root.render(element);
  });
  return root;
}

export function findAll(
  root: Root,
  predicate: (node: TestInstance) => boolean,
): TestInstance[] {
  return root.container.queryAll(predicate);
}

export function findOne(
  root: Root,
  predicate: (node: TestInstance) => boolean,
  description: string,
): TestInstance {
  const result = findAll(root, predicate);
  if (result.length !== 1) {
    throw new Error(`Expected one ${description}, found ${result.length}.`);
  }
  return result[0];
}

export function collectText(node: TestInstance): string[] {
  const text: string[] = [];

  const visit = (value: TestInstance): void => {
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
