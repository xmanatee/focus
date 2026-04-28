import { describe, expect, it } from 'vitest';
import { EMPTY_BLOCK_SELECTION } from '../blocker/types';
import type { AdminState } from '../settings/adminState';
import { resolveEditPolicy } from './editPolicy';
import type { FocusBlock } from './types';

describe('resolveEditPolicy', () => {
  const now = new Date('2026-04-28T10:00:00');
  const lockedState: AdminState = {
    kind: 'locked',
    nextUnlock: { at: new Date('2026-04-28T20:00:00'), day: 'tue' },
  };
  const unlockedState: AdminState = { kind: 'unlocked', reason: 'always' };

  const mockBlock: FocusBlock = {
    id: '1',
    name: 'Work',
    startTime: '09:00',
    endTime: '17:00',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    isEnabled: true,
    selection: EMPTY_BLOCK_SELECTION,
    notifyOnStart: false,
    notifyOnEnd: false,
    strict: false,
  };

  it('is NOT read-only when admin is locked but we are creating a new block', () => {
    const policy = resolveEditPolicy(lockedState, null, now);
    expect(policy.readOnly).toBe(false);
    expect(policy.title).toBe('Lock-in is active');
    expect(policy.message).toContain('You can add new blocks');
  });

  it('is read-only when editing an existing block and admin is locked', () => {
    const policy = resolveEditPolicy(lockedState, mockBlock, now);
    expect(policy.readOnly).toBe(true);
    expect(policy.title).toBe('Read-only');
  });

  it('is editable when admin is unlocked and block is not active', () => {
    const evening = new Date('2026-04-28T20:00:00');
    const policy = resolveEditPolicy(unlockedState, mockBlock, evening);
    expect(policy.readOnly).toBe(false);
    expect(policy.title).toBeNull();
  });

  it('is read-only when block is active even if admin is unlocked', () => {
    const policy = resolveEditPolicy(unlockedState, mockBlock, now);
    expect(policy.readOnly).toBe(true);
    expect(policy.title).toBe('Read-only');
    expect(policy.message).toContain('active');
  });
});
