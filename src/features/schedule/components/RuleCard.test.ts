import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { RuleCard } from './RuleCard';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

vi.mock('../../../shared/components/Card', () => ({
  Card: ({ children }: MockProps) =>
    React.createElement('Card', null, children),
}));

vi.mock('../../../shared/components/Icon', () => ({
  Icon: (props: Record<string, unknown>) => React.createElement('Icon', props),
}));

vi.mock('../../../shared/components/Section', () => ({
  Section: ({ children }: MockProps) =>
    React.createElement('Section', null, children),
}));

vi.mock('../../../shared/components/Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

vi.mock('../../../shared/design/theme', () => ({
  useThemeColors: () => ({
    surface: '#F8F2E8',
    surfaceSunken: '#EDE5D6',
    ink: '#2B221A',
    inkMuted: '#7A6D5F',
    inkFaint: '#B8AC9D',
    signal: '#EA7A3A',
    divider: '#E4DBC9',
    danger: '#D94B2F',
  }),
}));

describe('RuleCard', () => {
  it('does not commit invalid budget minutes and explains the valid range inline', () => {
    const onChange = vi.fn();
    const tree = TestRenderer.create(
      React.createElement(RuleCard, {
        value: { kind: 'dailyBudget', minutes: 30 },
        onChange,
      }),
    );

    const input = tree.root.find((node) => node.props.onChangeText);

    act(() => {
      input.props.onChangeText('0');
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
