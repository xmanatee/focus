import { describe, expect, it } from 'vitest';
import { resolveWizardStep } from './wizardProgress';

describe('resolveWizardStep', () => {
  it('starts with the intro before setup begins', () => {
    expect(
      resolveWizardStep({
        hasSeenIntro: false,
        acks: {
          screenTimeLock: { kind: 'unset' },
          appDeletion: { kind: 'unset' },
        },
      }),
    ).toBe('intro');
  });

  it('resumes at the first unfinished defense after the intro', () => {
    expect(
      resolveWizardStep({
        hasSeenIntro: true,
        acks: {
          screenTimeLock: { kind: 'unset' },
          appDeletion: { kind: 'unset' },
        },
      }),
    ).toBe('screenTimeLock');

    expect(
      resolveWizardStep({
        hasSeenIntro: true,
        acks: {
          screenTimeLock: { kind: 'set', at: 1 },
          appDeletion: { kind: 'unset' },
        },
      }),
    ).toBe('appDeletion');
  });

  it('lands on confirm when every defense has been acknowledged', () => {
    expect(
      resolveWizardStep({
        hasSeenIntro: true,
        acks: {
          screenTimeLock: { kind: 'set', at: 1 },
          appDeletion: { kind: 'set', at: 2 },
        },
      }),
    ).toBe('confirm');
  });
});
