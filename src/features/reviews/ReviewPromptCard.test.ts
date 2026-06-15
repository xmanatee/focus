import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SetupVerification } from '../diagnostics/diagnostics';
import { ReviewPromptCard } from './ReviewPromptCard';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorage,
}));

vi.mock('expo-linking', () => ({
  default: {
    openURL: vi.fn(async () => undefined),
  },
}));

vi.mock('../../shared/components/Button', () => ({
  Button: (props: Record<string, unknown>) =>
    React.createElement('Button', { ...props, testType: 'button' }),
}));

vi.mock('../../shared/components/Card', () => ({
  Card: ({ children }: MockProps) =>
    React.createElement('Card', null, children),
}));

vi.mock('../../shared/components/Icon', () => ({
  Icon: (props: Record<string, unknown>) => React.createElement('Icon', props),
}));

vi.mock('../../shared/components/Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

const readyVerification: SetupVerification = {
  activeBlockCount: 0,
  applicableBlockCount: 1,
  checks: [],
  level: 'ready',
  missingDeviceSelectionCount: 0,
  summary: 'Ready',
  title: 'Ready',
};

async function renderCard(
  verification: SetupVerification,
): Promise<TestRenderer.ReactTestRenderer> {
  let tree: TestRenderer.ReactTestRenderer | null = null;

  await act(async () => {
    tree = TestRenderer.create(
      React.createElement(ReviewPromptCard, {
        verification,
      }),
    );
    await Promise.resolve();
  });

  if (tree === null) {
    throw new Error('ReviewPromptCard did not render.');
  }

  return tree;
}

describe('ReviewPromptCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    asyncStorage.getItem.mockReset();
    asyncStorage.setItem.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays hidden while a previous snooze is still active', async () => {
    asyncStorage.getItem.mockResolvedValue(
      JSON.stringify({
        kind: 'snoozed',
        until: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }),
    );

    const tree = await renderCard(readyVerification);
    expect(
      tree.root.findAll((node) => node.props.testType === 'button'),
    ).toHaveLength(0);
  });

  it('stores a structured snooze state when the user taps Not now', async () => {
    asyncStorage.getItem.mockResolvedValue(null);

    const tree = await renderCard(readyVerification);

    const notNowButton = tree.root
      .findAll((node) => node.props.testType === 'button')
      .find(
        (node: TestRenderer.ReactTestInstance) =>
          node.props.title === 'Not now',
      );

    await act(async () => {
      notNowButton?.props.onPress();
      await Promise.resolve();
    });

    expect(asyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(asyncStorage.setItem.mock.calls[0]?.[1]).toContain(
      '"kind":"snoozed"',
    );
  });
});
