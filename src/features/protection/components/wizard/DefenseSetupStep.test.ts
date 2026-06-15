import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageMap } from '../../../../test-helpers/mockPersistedStorage';
import { useTamperSetupStore } from '../../useTamperSetupStore';
import { DefenseSetupStep } from './DefenseSetupStep';

type MockProps = Record<string, unknown> & {
  readonly children?: React.ReactNode;
};

vi.mock('../../../../shared/components/Button', () => ({
  Button: (props: Record<string, unknown>) =>
    React.createElement('Button', { ...props, testType: 'button' }),
}));

vi.mock('../../../../shared/components/Checklist', () => ({
  Checklist: (props: Record<string, unknown>) =>
    React.createElement('Checklist', props),
}));

vi.mock('../../../../shared/components/Typography', () => ({
  Typography: ({ children, ...props }: MockProps) =>
    React.createElement('Text', props, children),
}));

vi.mock('../../../../shared/design/haptics', () => ({
  haptic: {
    commit: vi.fn(async () => undefined),
  },
}));

vi.mock('./WizardStepShell', () => ({
  WizardStepShell: ({ children }: MockProps) =>
    React.createElement('WizardStepShell', null, children),
}));

vi.mock('expo-linking', () => ({
  default: {
    openSettings: vi.fn(async () => undefined),
  },
}));

function resetStore(): void {
  storageMap.clear();
  useTamperSetupStore.setState({
    setup: {
      hasSeenIntro: false,
      acks: {
        screenTimeLock: { kind: 'unset' },
        appDeletion: { kind: 'unset' },
      },
    },
  });
}

describe('DefenseSetupStep', () => {
  beforeEach(resetStore);

  it('keeps continue disabled until the defense has been confirmed', () => {
    const tree = TestRenderer.create(
      React.createElement(DefenseSetupStep, {
        defense: 'screenTimeLock',
        step: 2,
        onNext: vi.fn(),
        onClose: vi.fn(),
      }),
    );

    const continueButton = tree.root
      .findAll((node) => node.props.testType === 'button')
      .find((node) => node.props.title === 'Continue');

    expect(continueButton?.props.disabled).toBe(true);

    act(() => {
      useTamperSetupStore.getState().toggle('screenTimeLock');
      tree.update(
        React.createElement(DefenseSetupStep, {
          defense: 'screenTimeLock',
          step: 2,
          onNext: vi.fn(),
          onClose: vi.fn(),
        }),
      );
    });

    const enabledContinueButton = tree.root
      .findAll((node) => node.props.testType === 'button')
      .find((node) => node.props.title === 'Continue');

    expect(enabledContinueButton?.props.disabled).toBe(false);
  });
});
