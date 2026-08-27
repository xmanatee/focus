import React, { act } from 'react';
import type { Root, TestInstance } from 'test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { findAll, findOne, renderTestRoot } from '../../test-helpers/reactTest';
import type { SetupVerification } from '../diagnostics/diagnostics';
import { ReviewPromptCard } from './ReviewPromptCard';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

const asyncStorage = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));
const storeReview = vi.hoisted(() => ({
  storeUrl: vi.fn(),
}));
const linking = vi.hoisted(() => ({
  openURL: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorage,
}));

vi.mock('expo-store-review', () => storeReview);
vi.mock('expo-linking', () => linking);

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
  blockCount: 1,
  checks: [],
  level: 'ready',
  missingDeviceSelectionCount: 0,
  unsupportedEnabledBlockCount: 0,
  summary: 'Ready',
  title: 'Ready',
};

async function renderCard(
  verification: SetupVerification,
  completedScheduledWindowCount = 3,
): Promise<Root> {
  const tree = await renderTestRoot(
    React.createElement(ReviewPromptCard, {
      completedScheduledWindowCount,
      verification,
    }),
  );
  await act(async () => {
    await Promise.resolve();
  });
  return tree;
}

describe('ReviewPromptCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T10:00:00Z'));
    asyncStorage.getItem.mockReset();
    asyncStorage.setItem.mockReset();
    storeReview.storeUrl.mockReset();
    linking.openURL.mockReset();
    storeReview.storeUrl.mockReturnValue('https://apps.apple.com/app/id123');
    linking.openURL.mockResolvedValue(undefined);
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
    expect(findAll(tree, isButton)).toHaveLength(0);
  });

  it('stores a structured snooze state when the user taps Not now', async () => {
    asyncStorage.getItem.mockResolvedValue(null);

    const tree = await renderCard(readyVerification);

    const notNowButton = button(tree, 'Not now');

    await act(async () => {
      notNowButton.props.onPress();
      await Promise.resolve();
    });

    expect(asyncStorage.setItem).toHaveBeenCalledTimes(1);
    expect(asyncStorage.setItem.mock.calls[0]?.[1]).toContain(
      '"kind":"snoozed"',
    );
  });

  it('opens the public store page after proven value', async () => {
    asyncStorage.getItem.mockResolvedValue(null);
    const tree = await renderCard(readyVerification);

    await act(async () => {
      button(tree, 'Review Focus Blocks').props.onPress();
      await Promise.resolve();
    });

    expect(linking.openURL).toHaveBeenCalledWith(
      'https://apps.apple.com/app/id123',
    );
    expect(asyncStorage.setItem.mock.calls[0]?.[1]).toContain(
      '"kind":"reviewed"',
    );
  });

  it('stays hidden before three completed windows', async () => {
    asyncStorage.getItem.mockResolvedValue(null);
    const tree = await renderCard(readyVerification, 2);
    expect(findAll(tree, isButton)).toHaveLength(0);
  });

  it('stays hidden without a public store page', async () => {
    asyncStorage.getItem.mockResolvedValue(null);
    storeReview.storeUrl.mockReturnValue(null);
    const tree = await renderCard(readyVerification);
    expect(findAll(tree, isButton)).toHaveLength(0);
  });
});

function isButton(node: TestInstance): boolean {
  return node.props.testType === 'button';
}

function button(tree: Root, title: string): TestInstance {
  return findOne(
    tree,
    (node) => isButton(node) && node.props.title === title,
    `"${title}" button`,
  );
}
