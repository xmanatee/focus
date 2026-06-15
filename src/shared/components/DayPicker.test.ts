import React from 'react';
import TestRenderer from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { collectText } from '../../test-helpers/reactTest';
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
  it('renders distinct short labels and explicit accessibility names', () => {
    const tree = TestRenderer.create(
      React.createElement(DayPicker, {
        selected: [],
        onToggle: vi.fn(),
      }),
    );

    expect(collectText(tree.root)).toEqual([
      'Mo',
      'Tu',
      'We',
      'Th',
      'Fr',
      'Sa',
      'Su',
    ]);

    const buttons = tree.root.findAll(
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
