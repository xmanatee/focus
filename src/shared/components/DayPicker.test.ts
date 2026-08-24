import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  collectText,
  findAll,
  renderTestRoot,
} from '../../test-helpers/reactTest';
import { DayPicker } from './DayPicker';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

vi.mock('../design/haptics', () => ({
  haptic: {
    select: vi.fn(async () => undefined),
  },
}));

vi.mock('./Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

describe('DayPicker', () => {
  it('renders distinct short labels and explicit accessibility names', async () => {
    const tree = await renderTestRoot(
      React.createElement(DayPicker, {
        selected: [],
        onToggle: vi.fn(),
      }),
    );

    expect(collectText(tree.container)).toEqual([
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ]);

    const buttons = findAll(
      tree,
      (node) => node.props.accessibilityRole === 'button',
    );

    expect([
      ...new Set(buttons.map((node) => node.props.accessibilityLabel)),
    ]).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
  });
});
