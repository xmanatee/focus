import React from 'react';
import TestRenderer from 'react-test-renderer';
import { describe, expect, it, vi } from 'vitest';
import { focusBlockInput } from '../../../test-helpers/focusBlockFixtures';
import { FocusBlockListSection } from './FocusBlockListSection';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

vi.mock('../../../shared/components/Section', () => ({
  Section: ({ children }: MockProps) =>
    React.createElement('Section', null, children),
}));

vi.mock('../../../shared/components/Card', () => ({
  Card: ({ children }: MockProps) =>
    React.createElement('Card', null, children),
}));

vi.mock('../../../shared/components/Button', () => ({
  Button: (props: MockProps) => React.createElement('Button', props),
}));

vi.mock('../../../shared/components/Icon', () => ({
  Icon: (props: MockProps) => React.createElement('Icon', props),
}));

vi.mock('../../../shared/components/Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

vi.mock('./FocusBlockRow', () => ({
  FocusBlockRow: (props: MockProps) =>
    React.createElement('FocusBlockRow', props),
}));

describe('FocusBlockListSection', () => {
  it('allows enabling a configured block while Lock-in is active when it is off here', () => {
    const tree = TestRenderer.create(
      React.createElement(FocusBlockListSection, {
        enabledBlockIds: [],
        focusBlocks: [
          {
            id: 'off-here',
            ...focusBlockInput(),
          },
        ],
        isAdminLocked: true,
        now: new Date('2026-04-25T15:00:00'),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const row = tree.root.findAll(
      (node) => String(node.type) === 'FocusBlockRow',
    )[0];
    expect(row?.props.toggleDisabled).toBe(false);
  });

  it('allows turning off a locally enabled block that cannot run because local app selection is missing', () => {
    const tree = TestRenderer.create(
      React.createElement(FocusBlockListSection, {
        enabledBlockIds: ['needs-selection'],
        focusBlocks: [
          {
            id: 'needs-selection',
            ...focusBlockInput({
              selection: {
                activitySelection: {
                  applicationCount: 1,
                  categoryCount: 0,
                  includeEntireCategory: false,
                  status: 'saved',
                  webDomainCount: 0,
                },
                webDomains: [],
              },
            }),
          },
        ],
        isAdminLocked: true,
        now: new Date('2026-04-25T15:00:00'),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const row = tree.root.findAll(
      (node) => String(node.type) === 'FocusBlockRow',
    )[0];
    expect(row?.props.toggleDisabled).toBe(false);
  });
});
