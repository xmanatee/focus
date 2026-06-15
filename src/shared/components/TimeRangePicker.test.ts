import React from 'react';
import TestRenderer from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { TimeRangePicker } from './TimeRangePicker';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

vi.mock('@react-native-community/datetimepicker', () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement('DateTimePicker', {
      ...props,
      testType: 'date-time-picker',
    }),
}));

vi.mock('../design/theme', () => ({
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
  useIsDark: () => false,
}));

vi.mock('./Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

describe('TimeRangePicker', () => {
  it('uses the native compact picker without transform hacks', () => {
    const tree = TestRenderer.create(
      React.createElement(TimeRangePicker, {
        start: new Date('2026-06-15T09:00:00'),
        end: new Date('2026-06-15T17:00:00'),
        onStartChange: vi.fn(),
        onEndChange: vi.fn(),
      }),
    );

    const pickers = tree.root.findAll(
      (node) => node.props.testType === 'date-time-picker',
    );

    expect(pickers).toHaveLength(2);
    expect(pickers.map((picker) => picker.props.display)).toEqual([
      'compact',
      'compact',
    ]);
    expect(
      pickers.every((picker) => picker.props.style?.transform === undefined),
    ).toBe(true);
  });
});
