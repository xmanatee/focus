import React from 'react';
import TestRenderer from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { focusBlockInput } from '../../../test-helpers/focusBlockFixtures';
import { collectText } from '../../../test-helpers/reactTest';
import { FocusBlockRow } from './FocusBlockRow';

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

describe('FocusBlockRow', () => {
  it('marks overnight schedules in the visible rule summary', () => {
    const block = {
      id: 'overnight',
      ...focusBlockInput({
        days: ['mon'],
        startTime: '22:00',
        endTime: '06:00',
      }),
    };

    const tree = TestRenderer.create(
      React.createElement(FocusBlockRow, {
        block,
        isEnabled: true,
        isActive: false,
        needsDeviceSelection: false,
        toggleDisabled: false,
        onPress: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    expect(collectText(tree.root)).toContain('Mon · 22:00–06:00 next day');
  });
});
