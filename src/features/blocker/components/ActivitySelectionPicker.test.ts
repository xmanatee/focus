import React, { act } from 'react';
import type { Root, TestInstance } from 'test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findAll,
  findOne,
  renderTestRoot,
} from '../../../test-helpers/reactTest';
import { selectionIdForBlock } from '../types';
import { ActivitySelectionPicker } from './ActivitySelectionPicker';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

const blocker = vi.hoisted(() => ({
  getSelectionSlotValue: vi.fn(),
  listSelectableApplications: vi.fn(),
  setSelectionSlotValue: vi.fn(),
}));

vi.mock('../../../bridge/BlockerBridge', () => ({
  BlockerBridge: blocker,
  parseSelectedApplications: (raw: string | undefined) =>
    raw ? JSON.parse(raw).applications : [],
  serializeSelectedApplications: (
    applications: readonly { readonly id: string; readonly name: string }[],
  ) => JSON.stringify({ applications }),
}));

vi.mock('../../../shared/components/Button', () => ({
  Button: (props: Record<string, unknown>) =>
    React.createElement('Button', { ...props, testType: 'button' }),
}));

vi.mock('../../../shared/components/Card', () => ({
  Card: ({ children }: MockProps) =>
    React.createElement('Card', null, children),
}));

vi.mock('../../../shared/components/Icon', () => ({
  Icon: (props: Record<string, unknown>) => React.createElement('Icon', props),
}));

vi.mock('../../../shared/components/Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

vi.mock('../../../shared/design/theme', () => ({
  useThemeColors: () => ({
    ink: '#2B221A',
    inkFaint: '#B8AC9D',
    surface: '#F8F2E8',
  }),
}));

async function renderPicker(): Promise<Root> {
  const tree = await renderTestRoot(
    React.createElement(ActivitySelectionPicker, {
      familyActivitySelectionId: selectionIdForBlock('test'),
      includeEntireCategory: false,
      onDismissRequest: vi.fn(),
      onSelectionChange: vi.fn(),
    }),
  );
  await act(async () => {
    await Promise.resolve();
  });
  return tree;
}

function button(tree: Root, title: string): TestInstance {
  return findOne(
    tree,
    (node) => node.props.testType === 'button' && node.props.title === title,
    `"${title}" button`,
  );
}

describe('ActivitySelectionPicker', () => {
  beforeEach(() => {
    blocker.getSelectionSlotValue.mockReset();
    blocker.listSelectableApplications.mockReset();
    blocker.setSelectionSlotValue.mockReset();
    blocker.getSelectionSlotValue.mockReturnValue(undefined);
  });

  it('does not allow saving before installed apps finish loading', async () => {
    let resolveApplications:
      | ((applications: readonly { id: string; name: string }[]) => void)
      | undefined;
    blocker.listSelectableApplications.mockReturnValue(
      new Promise((resolve) => {
        resolveApplications = resolve;
      }),
    );

    const tree = await renderPicker();
    expect(button(tree, 'Save apps').props.disabled).toBe(true);

    await act(async () => {
      resolveApplications?.([{ id: 'com.example.app', name: 'Example' }]);
      await Promise.resolve();
    });

    expect(button(tree, 'Save apps').props.disabled).toBe(false);
  });

  it('preserves a stored package that is missing from the launcher query', async () => {
    blocker.getSelectionSlotValue.mockReturnValue(
      JSON.stringify({
        applications: [{ id: 'com.example.old', name: 'Previously selected' }],
      }),
    );
    blocker.listSelectableApplications.mockResolvedValue([
      { id: 'com.example.current', name: 'Current app' },
    ]);

    const tree = await renderPicker();
    expect(
      findAll(
        tree,
        (node) =>
          node.type === 'Text' &&
          node.children.includes('com.example.old · Not currently installed'),
      ),
    ).toHaveLength(1);

    await act(async () => {
      button(tree, 'Save apps').props.onPress();
      await Promise.resolve();
    });

    const saved = JSON.parse(blocker.setSelectionSlotValue.mock.calls[0]?.[1]);
    expect(saved.applications).toEqual([
      { id: 'com.example.old', name: 'Previously selected' },
    ]);
  });

  it('keeps saving disabled after a load error and provides a retry', async () => {
    blocker.listSelectableApplications
      .mockRejectedValueOnce(new Error('Package manager unavailable'))
      .mockResolvedValueOnce([]);

    const tree = await renderPicker();
    expect(button(tree, 'Save apps').props.disabled).toBe(true);

    await act(async () => {
      button(tree, 'Try again').props.onPress();
      await Promise.resolve();
    });

    expect(blocker.listSelectableApplications).toHaveBeenCalledTimes(2);
    expect(button(tree, 'Save apps').props.disabled).toBe(false);
  });
});
