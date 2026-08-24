import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { focusBlockInput } from '../../../test-helpers/focusBlockFixtures';
import { collectText, renderTestRoot } from '../../../test-helpers/reactTest';
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
  it('marks overnight schedules in the visible rule summary', async () => {
    const block = {
      id: 'overnight',
      ...focusBlockInput({
        days: ['mon'],
        startTime: '22:00',
        endTime: '06:00',
      }),
    };

    const tree = await renderTestRoot(
      React.createElement(FocusBlockRow, {
        block,
        isEnabled: true,
        isActive: false,
        needsDeviceSelection: false,
        unsupportedReason: null,
        toggleDisabled: false,
        onPress: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    expect(collectText(tree.container)).toContain('Mon · 22:00–06:00 next day');
  });

  it('keeps synced app counts visible while this device still needs local selection', async () => {
    const block = {
      id: 'needs-local-selection',
      ...focusBlockInput({
        selection: {
          activitySelection: {
            status: 'saved',
            applicationCount: 36,
            categoryCount: 1,
            webDomainCount: 4,
            includeEntireCategory: false,
          },
          webDomains: ['youtube.com'],
        },
      }),
    };

    const tree = await renderTestRoot(
      React.createElement(FocusBlockRow, {
        block,
        isEnabled: true,
        isActive: false,
        needsDeviceSelection: true,
        unsupportedReason: null,
        toggleDisabled: false,
        onPress: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const text = collectText(tree.container);
    expect(text).toContain('Pick apps here');
    expect(text).toContain('1 site');
    expect(text).toContain('36 apps, 1 category, 4 domains');
  });

  it('marks blocks that cannot run on this device runtime', async () => {
    const block = {
      id: 'unsupported',
      ...focusBlockInput(),
    };

    const tree = await renderTestRoot(
      React.createElement(FocusBlockRow, {
        block,
        isEnabled: true,
        isActive: false,
        needsDeviceSelection: false,
        unsupportedReason: 'Website blocking is not available here.',
        toggleDisabled: false,
        onPress: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    expect(collectText(tree.container)).toContain('Unsupported here');
  });
});
