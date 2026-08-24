import React, { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { findOne, renderTestRoot } from '../../../test-helpers/reactTest';
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
  it('commits an invalid marker so the form cannot save stale budget minutes', async () => {
    const onChange = vi.fn();
    const tree = await renderTestRoot(
      React.createElement(RuleCard, {
        value: { kind: 'dailyBudget', minutes: 30 },
        onChange,
      }),
    );

    const input = findOne(
      tree,
      (node) => typeof node.props.onChangeText === 'function',
      'budget input',
    );

    act(() => {
      input.props.onChangeText('');
    });

    expect(onChange).toHaveBeenCalledWith({
      kind: 'dailyBudget',
      minutes: Number.NaN,
    });
  });
});
