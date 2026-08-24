import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { focusBlockInput } from '../../../test-helpers/focusBlockFixtures';
import { findOne, renderTestRoot } from '../../../test-helpers/reactTest';
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
  it('allows enabling a configured block while Lock-in is active when it is off here', async () => {
    const tree = await renderTestRoot(
      React.createElement(FocusBlockListSection, {
        enabledBlockIds: [],
        focusBlocks: [
          {
            id: 'off-here',
            ...focusBlockInput(),
          },
        ],
        hasBlockingAccess: true,
        isAdminLocked: true,
        now: new Date('2026-04-25T15:00:00'),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const row = findOne(
      tree,
      (node) => String(node.type) === 'FocusBlockRow',
      'focus block row',
    );
    expect(row.props.toggleDisabled).toBe(false);
  });

  it('allows turning off a locally enabled block that cannot run because local app selection is missing', async () => {
    const tree = await renderTestRoot(
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
        hasBlockingAccess: true,
        isAdminLocked: true,
        now: new Date('2026-04-25T15:00:00'),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const row = findOne(
      tree,
      (node) => String(node.type) === 'FocusBlockRow',
      'focus block row',
    );
    expect(row.props.toggleDisabled).toBe(false);
  });

  it('allows turning off a regular block while it is active', async () => {
    const tree = await renderTestRoot(
      React.createElement(FocusBlockListSection, {
        enabledBlockIds: ['regular'],
        focusBlocks: [
          {
            id: 'regular',
            ...focusBlockInput({
              days: ['mon'],
              startTime: '09:00',
              endTime: '17:00',
            }),
          },
        ],
        hasBlockingAccess: true,
        isAdminLocked: false,
        now: new Date('2026-04-27T12:00:00'),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const row = findOne(
      tree,
      (node) => String(node.type) === 'FocusBlockRow',
      'focus block row',
    );
    expect(row.props.toggleDisabled).toBe(false);
  });

  it('prevents turning off a strict block while it is active', async () => {
    const tree = await renderTestRoot(
      React.createElement(FocusBlockListSection, {
        enabledBlockIds: ['strict'],
        focusBlocks: [
          {
            id: 'strict',
            ...focusBlockInput({
              days: ['mon'],
              startTime: '09:00',
              endTime: '17:00',
              strict: true,
            }),
          },
        ],
        hasBlockingAccess: true,
        isAdminLocked: false,
        now: new Date('2026-04-27T12:00:00'),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const row = findOne(
      tree,
      (node) => String(node.type) === 'FocusBlockRow',
      'focus block row',
    );
    expect(row.props.toggleDisabled).toBe(true);
  });

  it('requires blocking access before a block can be turned on', async () => {
    const tree = await renderTestRoot(
      React.createElement(FocusBlockListSection, {
        enabledBlockIds: [],
        focusBlocks: [
          {
            id: 'ready',
            ...focusBlockInput(),
          },
        ],
        hasBlockingAccess: false,
        isAdminLocked: false,
        now: new Date('2026-04-27T12:00:00'),
        onAdd: vi.fn(),
        onEdit: vi.fn(),
        onToggle: vi.fn(),
      }),
    );

    const row = findOne(
      tree,
      (node) => String(node.type) === 'FocusBlockRow',
      'focus block row',
    );
    expect(row.props.toggleDisabled).toBe(true);
  });
});
