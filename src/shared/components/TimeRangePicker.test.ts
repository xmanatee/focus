import React, { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findAll, renderTestRoot } from '../../test-helpers/reactTest';
import { TimeRangePicker } from './TimeRangePicker';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

const nativePicker = vi.hoisted(() => ({
  open: vi.fn(),
}));

vi.mock('@react-native-community/datetimepicker', () => ({
  DateTimePickerAndroid: nativePicker,
}));

vi.mock('./Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

describe('TimeRangePicker on Android', () => {
  beforeEach(() => {
    nativePicker.open.mockReset();
  });

  it('opens one native dialog only after the requested time is pressed', async () => {
    const onStartChange = vi.fn();
    const start = new Date('2026-06-15T09:00:00');
    const end = new Date('2026-06-15T17:00:00');
    const tree = await renderTestRoot(
      React.createElement(TimeRangePicker, {
        start,
        end,
        onStartChange,
        onEndChange: vi.fn(),
      }),
    );

    expect(nativePicker.open).not.toHaveBeenCalled();
    const buttons = findAll(
      tree,
      (node) => node.props.accessibilityRole === 'button',
    );
    expect(buttons).toHaveLength(2);

    act(() => buttons[0]?.props.onPress());
    expect(nativePicker.open).toHaveBeenCalledTimes(1);

    const options = nativePicker.open.mock.calls[0]?.[0];
    expect(options).toMatchObject({
      value: start,
      mode: 'time',
      display: 'default',
    });

    act(() => options.onChange({ type: 'dismissed' }, start));
    expect(onStartChange).not.toHaveBeenCalled();

    const next = new Date('2026-06-15T10:30:00');
    act(() => options.onChange({ type: 'set' }, next));
    expect(onStartChange).toHaveBeenCalledWith(next);
  });

  it('disables both time controls in read-only mode', async () => {
    const tree = await renderTestRoot(
      React.createElement(TimeRangePicker, {
        start: new Date('2026-06-15T09:00:00'),
        end: new Date('2026-06-15T17:00:00'),
        onStartChange: vi.fn(),
        onEndChange: vi.fn(),
        disabled: true,
      }),
    );

    const buttons = findAll(
      tree,
      (node) => node.props.accessibilityRole === 'button',
    );
    expect(buttons.every((button) => button.props.disabled === true)).toBe(
      true,
    );
  });
});
